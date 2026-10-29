import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { admin } from "./admin.functions";
import { cardSchema, setSchema, achievementSchema } from "./club";
import { sanitizeCardSvg, uploadLimits } from "./card-upload";
export const adminUploadCardAsset = createServerFn({ method: "POST" }).validator((d: unknown) => z.object({ token:z.string(), cardId:z.string().regex(/^[a-z0-9-]{2,80}$/), kind:z.enum(["background","sound","svg"]), mime:z.enum(["image/png","image/jpeg","image/webp","image/svg+xml","audio/mpeg","audio/wav","audio/ogg"]), bytes:z.string().max(7000000) }).parse(d)).handler(async ({data}) => {
  const db = await admin(data.token);
  let bytes = Uint8Array.from(atob(data.bytes), c => c.charCodeAt(0));
  if (!bytes.length || bytes.length > uploadLimits[data.kind]) throw new Error("File exceeds the upload size limit");
  const start = Array.from(bytes.slice(0,12)).map(v=>String.fromCharCode(v)).join("");
  const valid = data.kind === "svg" ? data.mime === "image/svg+xml" : data.kind === "background" ? (data.mime === "image/png" && bytes[0]===137 && start.slice(1,4)==="PNG") || (data.mime === "image/jpeg" && bytes[0]===255 && bytes[1]===216) || (data.mime === "image/webp" && start.startsWith("RIFF") && start.slice(8)==="WEBP") : (data.mime === "audio/wav" && start.startsWith("RIFF") && start.slice(8)==="WAVE") || (data.mime === "audio/ogg" && start.startsWith("OggS")) || (data.mime === "audio/mpeg" && (start.startsWith("ID3") || (bytes[0]===255 && ((bytes[1]??0)&224)===224)));
  if (!valid) throw new Error("Unsupported file type or invalid file contents");
  if (data.kind === "svg") bytes = new TextEncoder().encode(sanitizeCardSvg(new TextDecoder().decode(bytes)));
  const extension = {"image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/svg+xml":"svg","audio/mpeg":"mp3","audio/wav":"wav","audio/ogg":"ogg"}[data.mime];
  const path = `cards/${data.cardId}/${data.kind}/${crypto.randomUUID()}.${extension}`;
  const {error} = await db.storage.from("media").upload(path, bytes, {contentType:data.mime, upsert:false});
  if (error) throw new Error("Upload failed. Please try again.");
  const {data: signed,error: signingError} = await db.storage.from("media").createSignedUrl(path,60*60*24*365*10);
  if (signingError || !signed) throw new Error("Cannot open uploaded file");
  const base = import.meta.env['VITE_SUPABASE_URL'];
  return {url: signed.signedUrl.replace(new URL(signed.signedUrl).origin, base), path};
});
export const adminClub = createServerFn({ method: "POST" }).validator((d: unknown) => z.object({ token: z.string() }).parse(d)).handler(async ({ data }) => {
  const db = await admin(data.token);
  const [cards, sets, achievements, claims] = await Promise.all([db.from("card_definitions").select("*").order("sort_order"), db.from("card_sets").select("*").order("sort_order"), db.from("achievement_definitions").select("id,title,description,category,requirement_type,requirement_value,card_id,target_set_id,rarity,is_secret,is_active,sort_order").order("sort_order"), db.from("set_reward_claims").select("*").order("claimed_at", { ascending: false })]);
  for (const r of [cards, sets, achievements, claims]) if (r.error) throw r.error;
  return { cards: cards.data ?? [], sets: sets.data ?? [], achievements: achievements.data ?? [], claims: claims.data ?? [] };
});
export const adminSaveCard = createServerFn({ method: "POST" }).validator((d: unknown) => z.object({ token: z.string(), card: cardSchema }).parse(d)).handler(async ({ data }) => { const db = await admin(data.token); const { error } = await db.from("card_definitions").upsert(data.card); if (error) throw error; return { ok: true }; });
export const adminSaveSet = createServerFn({ method: "POST" }).validator((d: unknown) => z.object({ token: z.string(), set: setSchema }).parse(d)).handler(async ({ data }) => { const db = await admin(data.token); const { error } = await db.from("card_sets").upsert(data.set); if (error) throw error; return { ok: true }; });
export const adminSaveAchievement = createServerFn({ method: "POST" }).validator((d: unknown) => z.object({ token: z.string(), achievement: achievementSchema }).parse(d)).handler(async ({ data }) => {
  const db = await admin(data.token);
  const { data: card, error: readError } = await db.from("card_definitions").select("set_id").eq("id", data.achievement.card_id).single();
  if (readError) throw readError;
  if (card.set_id !== data.achievement.target_set_id) throw new Error("The awarded card must belong to the target set");
  const { error } = await db.from("achievement_definitions").upsert({ ...data.achievement, updated_at: new Date().toISOString() }); if (error) throw error; return { ok: true };
});
export const adminFulfillReward = createServerFn({ method: "POST" }).validator((d: unknown) => z.object({ token: z.string(), id: z.string().uuid(), status: z.enum(["claimed", "processing", "fulfilled"]) }).parse(d)).handler(async ({ data }) => { const db = await admin(data.token); const { error } = await db.from("set_reward_claims").update({ status: data.status, fulfilled_at: data.status === "fulfilled" ? new Date().toISOString() : null }).eq("id", data.id); if (error) throw error; return { ok: true }; });
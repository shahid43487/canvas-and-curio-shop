import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { admin } from "./admin.functions";
import { cardSchema, setSchema, achievementSchema } from "./club";
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
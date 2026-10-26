import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [orders, profile, coupons] = await Promise.all([
    context.supabase.from("orders").select("*, order_items(*)").eq("user_id", context.userId).order("created_at", { ascending: false }),
    context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
    context.supabase.from("customer_coupons").select("*").eq("user_id", context.userId),
  ]);
  if (orders.error) throw orders.error;
  if (profile.error) throw profile.error;
  if (coupons.error) throw coupons.error;

  // Lazy-create the member profile on first sign-in so the account page never
  // fails just because the profiles row does not exist yet.
  if (!profile.data) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const displayName = context.claims.full_name || context.claims.name || null;
    const { data: created, error: createError } = await (supabaseAdmin as any).from("profiles")
      .upsert({ id: context.userId, display_name: displayName ?? "" }, { onConflict: "id" })
      .select("*").single();
    if (!createError && created) {
      return { orders: orders.data, profile: created, coupons: coupons.data };
    }
  }

  return { orders: orders.data, profile: profile.data, coupons: coupons.data };
});
export const saveProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ display_name: z.string().trim().max(100) }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("profiles").update({ ...data, updated_at: new Date().toISOString() }).eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
export const cancelOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("cancel_customer_order", { order_id: data.id });
    if (error) throw error;
    return { ok: true };
  });
export const claimAchievementReward = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ achievement: z.string().regex(/^[a-z0-9-]{2,48}$/) }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: reward, error: rewardError } = await db.from("achievement_definitions")
      .select("id,title,requirement_type,requirement_value,reward_discount_type,reward_discount_value,is_active,is_secret")
      .eq("id", data.achievement).maybeSingle();
    if (rewardError) throw rewardError;
    if (!reward || !reward.is_active) throw new Error("This achievement is no longer available.");
    if (reward.requirement_type !== "delivered_orders") throw new Error("This achievement cannot be claimed through order milestones.");
    const { count, error: orderError } = await db.from("orders").select("id", { count: "exact", head: true }).eq("user_id", context.userId).eq("status", "delivered");
    if (orderError) throw orderError;
    if ((count ?? 0) < reward.requirement_value) throw new Error("Complete the achievement before claiming its reward.");
    const suffix = context.userId.replace(/-/g, "").slice(0, 8).toUpperCase();
    const code = `SMOL-${data.achievement.toUpperCase().replace(/-/g, "").slice(0, 12)}-${suffix}`;
    const { data: existing, error: existingError } = await db.from("customer_coupons").select("id").eq("user_id", context.userId).eq("code", code).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return { ok: true, code, alreadyClaimed: true };
    const { error: insertError } = await db.from("customer_coupons").insert({
      user_id: context.userId,
      code,
      description: `Achievement reward: ${reward.title}`,
      discount_type: reward.reward_discount_type,
      discount_value: reward.reward_discount_value,
      min_order: 0,
      expires_at: null,
      used_at: null,
    });
    if (insertError) throw insertError;
    return { ok: true, code, alreadyClaimed: false };
  });

// Server-verified collectible deck. Card ownership is persisted in customer_cards,
// not inferred from frontend state.
export const getCardDex = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const [cardsResult, couponsResult, achievementsResult, definitionsResult] = await Promise.all([
    db.from("customer_cards").select("id,card_type,source_id,serial_number,rarity,acquired_at,metadata").eq("user_id", context.userId).order("acquired_at", { ascending: false }),
    context.supabase.from("customer_coupons").select("id,code,description,discount_type,discount_value,min_order,expires_at,used_at"),
    db.from("customer_achievements").select("achievement_id,progress,completed_at,claimed_at").eq("user_id", context.userId),
    db.from("achievement_definitions").select("id,title,description,category,requirement_type,requirement_value,reward_discount_type,reward_discount_value,rarity,is_secret,sort_order").eq("is_active", true).order("sort_order"),
  ]);
  if (cardsResult.error) throw cardsResult.error;
  if (couponsResult.error) throw couponsResult.error;
  if (achievementsResult.error) throw achievementsResult.error;
  if (definitionsResult.error) throw definitionsResult.error;
  const coupons = couponsResult.data ?? [];
  const couponById = new Map(coupons.map((coupon: { id: string }) => [coupon.id, coupon]));
  const achievements = achievementsResult.data ?? [];
  const definitions = (definitionsResult.data ?? []).filter((a: { is_secret: boolean }) => !a.is_secret);
  const achievementById = new Map(achievements.map((a: { achievement_id: string }) => [a.achievement_id, a]));
  const cards = (cardsResult.data ?? []).map((card: { id: string; card_type: string; source_id: string; serial_number: string; rarity: string; acquired_at: string; metadata: unknown }) => ({
    ...card,
    coupon: card.card_type === "coupon" ? couponById.get(card.source_id) ?? null : null,
  }));
  const progress = definitions.map((definition: { id: string; requirement_type: string; requirement_value: number; is_secret: boolean; [key: string]: unknown }) => {
    const current = achievementById.get(definition.id) as { progress: number; completed_at: string | null; claimed_at: string | null } | undefined;
    return { ...definition, progress: current?.progress ?? 0, completed_at: current?.completed_at ?? null, claimed_at: current?.claimed_at ?? null };
  });
  return { cards, achievements: progress };
});

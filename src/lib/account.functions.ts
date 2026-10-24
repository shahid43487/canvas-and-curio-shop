import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [orders, profile, coupons] = await Promise.all([
    context.supabase.from("orders").select("*, order_items(*)").eq("user_id", context.userId).order("created_at", { ascending: false }),
    context.supabase.from("profiles").select("*").eq("id", context.userId).single(),
    context.supabase.from("customer_coupons").select("*").eq("user_id", context.userId),
  ]);
  if (orders.error) throw orders.error;
  if (profile.error) throw profile.error;
  if (coupons.error) throw coupons.error;
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
  .inputValidator(input => z.object({ achievement: z.enum(["first-drop", "collector-three", "inner-circle-five"]) }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const thresholds = {
      "first-drop": { orders: 1, code: "FIRSTDROP", discount_type: "percent", discount_value: 10, description: "Achievement reward: First Drop" },
      "collector-three": { orders: 3, code: "COLLECTOR", discount_type: "percent", discount_value: 15, description: "Achievement reward: Collector" },
      "inner-circle-five": { orders: 5, code: "INNER5", discount_type: "percent", discount_value: 20, description: "Achievement reward: Inner Circle" },
    } as const;
    const reward = thresholds[data.achievement];
    const { count, error: orderError } = await db.from("orders").select("id", { count: "exact", head: true }).eq("user_id", context.userId).eq("status", "delivered");
    if (orderError) throw orderError;
    if ((count ?? 0) < reward.orders) throw new Error("Complete the achievement before claiming its reward.");
    const suffix = context.userId.replace(/-/g, "").slice(0, 8).toUpperCase();
    const code = `SMOL-${reward.code}-${suffix}`;
    const { data: existing, error: existingError } = await db.from("customer_coupons").select("id").eq("user_id", context.userId).eq("code", code).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return { ok: true, code, alreadyClaimed: true };
    const { error: insertError } = await db.from("customer_coupons").insert({
      user_id: context.userId,
      code,
      description: reward.description,
      discount_type: reward.discount_type,
      discount_value: reward.discount_value,
      min_order: 0,
      expires_at: null,
      used_at: null,
    });
    if (insertError) throw insertError;
    return { ok: true, code, alreadyClaimed: false };
  });

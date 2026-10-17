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
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [orders, profile] = await Promise.all([
    context.supabase.from("orders").select("*, order_items(*)").eq("user_id", context.userId).order("created_at", { ascending: false }),
    context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
  ]);
  if (orders.error) throw orders.error;
  if (profile.error) throw profile.error;

  // Lazy-create the member profile on first sign-in so the account page never
  // fails just because the profiles row does not exist yet.
  if (!profile.data) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const meta = (context.claims as Record<string, unknown>)["user_metadata"] as Record<string, unknown> | undefined;
    const email = typeof context.claims.email === "string" ? context.claims.email : "";
    const displayName = (meta?.["full_name"] as string) || (meta?.["name"] as string) || email.split("@")[0] || "SMOL CLUB MEMBER";
    const { data: created, error: createError } = await supabaseAdmin.from("profiles")
      .upsert({ id: context.userId, display_name: displayName ?? "" }, { onConflict: "id" })
      .select("*").single();
    if (!createError && created) {
      return { orders: orders.data, profile: created };
    }
  }

  return { orders: orders.data, profile: profile.data };
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

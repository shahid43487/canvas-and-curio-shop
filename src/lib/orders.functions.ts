import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { couponDiscount } from "./coupon";

export type OrderItemInput = {
  product_id: number;
  variation_id?: string | undefined;
  quantity: number;
  unit_price: number;
};

export type OrderInput = {
  payment_method: "cod" | "bkash";
  bkash_transaction_id?: string | undefined;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_notes?: string | undefined;
  total_amount: number;
  order_source?: "regular" | "secret" | undefined;
  coupon_code?: string | undefined;
};

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { order: OrderInput; items: OrderItemInput[] }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { coupon_code, ...order } = data.order;
    const coupon = coupon_code?.trim();
    const bearer = getRequestHeader("authorization");
    let owner: string | null = null;
    if (bearer) {
      if (!bearer.startsWith("Bearer ")) throw new Error("Invalid sign-in session");
      const { data: auth, error } = await supabaseAdmin.auth.getUser(bearer.slice(7));
      if (error || !auth.user) throw new Error("Invalid sign-in session");
      owner = auth.user.id;
    }
    if (coupon && !owner) throw new Error("Sign in to use a coupon");
    // The database re-prices the cart and applies the coupon inside one transaction.
    const { data: orderId, error } = await supabaseAdmin.rpc("create_owned_order", {
      order_data: order as unknown as never,
      items: data.items as unknown as never,
      ...(owner ? { owner_id: owner } : {}),
      ...(coupon ? { coupon_code: coupon } : {}),
    });
    if (error) throw error;
    return { orderId: orderId as string };
  });

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), phone: z.string().min(8).max(32) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_method, payment_status, total_amount, discount_amount, shipping_name, shipping_address, shipping_city, shipping_phone, order_items(id, product_id, quantity, unit_price, products(name))")
      .eq("id", data.id)
      .eq("shipping_phone", data.phone)
      .single();
    if (error || !order) throw new Error("Order not found");
    return { order: { ...order, shipping_name: order.shipping_name.slice(0, 1) + "…", shipping_address: "Hidden for privacy", shipping_phone: "••••" + order.shipping_phone.slice(-4) } };
  });


// Preview only: the order function recomputes everything and is what actually charges.
export const previewCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.string().trim().min(1).max(64),
      items: z.array(z.object({ product_id: z.number().int(), variation_id: z.string().uuid().optional(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mine, error } = await context.supabase.from("customer_coupons").select("*").eq("user_id", context.userId);
    if (error) throw error;
    const now = Date.now();
    const coupon = (mine ?? [])
      .filter((c) => c.code.toUpperCase() === data.code.toUpperCase() && !c.used_at && (!c.expires_at || new Date(c.expires_at).getTime() > now))
      .sort((a, b) => (a.expires_at ? new Date(a.expires_at).getTime() : Infinity) - (b.expires_at ? new Date(b.expires_at).getTime() : Infinity))[0];
    if (!coupon) throw new Error("Coupon is invalid, expired or already used");
    const pids = [...new Set(data.items.map((i) => i.product_id))];
    const vids = [...new Set(data.items.flatMap((i) => (i.variation_id ? [i.variation_id] : [])))];
    const [products, variations] = await Promise.all([
      supabaseAdmin.from("products").select("id, price").in("id", pids),
      vids.length ? supabaseAdmin.from("product_variations").select("id, price").in("id", vids).eq("is_active", true) : Promise.resolve({ data: [], error: null }),
    ]);
    if (products.error) throw products.error;
    if (variations.error) throw variations.error;
    const price = new Map<string, number>([
      ...(products.data ?? []).map((p) => [`p${p.id}`, Number(p.price)] as const),
      ...(variations.data ?? []).map((v) => [`v${v.id}`, Number(v.price)] as const),
    ]);
    let subtotal = 0;
    for (const i of data.items) {
      const p = price.get(i.variation_id ? `v${i.variation_id}` : `p${i.product_id}`);
      if (p === undefined) throw new Error("An item in your cart is no longer available");
      subtotal += p * i.quantity;
    }
    const discount = couponDiscount({ discount_type: coupon.discount_type, discount_value: Number(coupon.discount_value), min_order: Number(coupon.min_order) }, subtotal);
    return { code: coupon.code, discount, subtotal, total: subtotal - discount };
  });

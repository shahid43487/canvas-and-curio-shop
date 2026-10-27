import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

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
};

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { order: OrderInput; items: OrderItemInput[] }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const order = data.order;
    const bearer = getRequestHeader("authorization");
    let owner: string | null = null;
    if (bearer) {
      if (!bearer.startsWith("Bearer ")) throw new Error("Invalid sign-in session");
      const { data: auth, error } = await supabaseAdmin.auth.getUser(bearer.slice(7));
      if (error || !auth.user) throw new Error("Invalid sign-in session");
      owner = auth.user.id;
    }
    // The database re-prices the cart inside one transaction.
    const { data: orderId, error } = await supabaseAdmin.rpc("create_club_order", {
      order_data: order as unknown as never,
      items: data.items as unknown as never,
      ...(owner ? { owner_id: owner } : {}),
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
      .select("id, status, payment_method, payment_status, total_amount, shipping_name, shipping_address, shipping_city, shipping_phone, order_items(id, product_id, quantity, unit_price, products(name))")
      .eq("id", data.id)
      .eq("shipping_phone", data.phone)
      .single();
    if (error || !order) throw new Error("Order not found");
    return { order: { ...order, shipping_name: order.shipping_name.slice(0, 1) + "…", shipping_address: "Hidden for privacy", shipping_phone: "••••" + order.shipping_phone.slice(-4) } };
  });



import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

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
    const bearer = getRequestHeader("authorization");
    let owner: string | null = null;
    if (bearer) {
      if (!bearer.startsWith("Bearer ")) throw new Error("Invalid sign-in session");
      const { data: auth, error } = await supabaseAdmin.auth.getUser(bearer.slice(7));
      if (error || !auth.user) throw new Error("Invalid sign-in session");
      owner = auth.user.id;
    }
    const { data: orderId, error } = await supabaseAdmin.rpc("create_owned_order", {
      order_data: data.order as unknown as never,
      items: data.items as unknown as never,
      owner_id: owner,
    });
    if (error) throw error;
    return { orderId: orderId as string };
  });

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string; phone: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*, products(*))")
      .eq("id", data.id)
      .eq("shipping_phone", data.phone)
      .single();
    if (error) throw error;
    return { order };
  });

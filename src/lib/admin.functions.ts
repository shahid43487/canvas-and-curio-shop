import { createServerFn } from "@tanstack/react-start";

type Auth = { token: string };
const ORDER_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

async function admin(token: string) {
  const expected = process.env["ADMIN_TOKEN"];
  if (!expected || token !== expected) throw new Error("Wrong admin key");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminDashboard = createServerFn({ method: "POST" })
  .inputValidator((d: Auth) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const [orders, lowProducts, lowVariations] = await Promise.all([
      db.from("orders").select("id, total_amount, created_at, status, payment_method, payment_status, shipping_name, order_source").order("created_at", { ascending: false }).limit(200),
      db.from("products").select("id, name, stock").lte("stock", 3),
      db.from("product_variations").select("id, name, stock, product_id").lte("stock", 3),
    ]);
    if (orders.error) throw orders.error;
    const all = orders.data ?? [];
    const today = all.filter((o) => new Date(o.created_at) >= since && o.status !== "cancelled");
    return {
      revenueToday: today.reduce((s, o) => s + Number(o.total_amount), 0),
      ordersToday: today.length,
      pendingBkash: all.filter((o) => o.payment_method === "bkash" && o.payment_status === "pending" && o.status !== "cancelled").length,
      lowStock: [...(lowProducts.data ?? []), ...(lowVariations.data ?? [])].map((r) => ({ name: r.name, stock: r.stock })),
      recent: all.slice(0, 8),
    };
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .inputValidator((d: Auth) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { data: orders, error } = await db
      .from("orders")
      .select("*, order_items(quantity, unit_price, variation_id, products(name), product_variations(name))")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return { orders: orders ?? [] };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .inputValidator((d: Auth & { id: string; status?: string; payment_status?: "pending" | "paid" }) => {
    if (d.status && !ORDER_STATUS.includes(d.status as never)) throw new Error("Bad status");
    if (d.payment_status && !["pending", "paid"].includes(d.payment_status)) throw new Error("Bad payment status");
    return d;
  })
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const patch: { status?: (typeof ORDER_STATUS)[number]; payment_status?: "pending" | "paid" } = {};
    if (data.status) patch.status = data.status as (typeof ORDER_STATUS)[number];
    if (data.payment_status) patch.payment_status = data.payment_status;
    const { error } = await db.from("orders").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListProducts = createServerFn({ method: "POST" })
  .inputValidator((d: Auth) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { data: products, error } = await db
      .from("products")
      .select("id, name, num, price, stock, is_hidden, tag, product_variations(id, name, price, stock, display_order)")
      .order("id");
    if (error) throw error;
    return { products: products ?? [] };
  });

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: Auth & { id: number; price?: number; stock?: number; is_hidden?: boolean }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const patch: { price?: number; stock?: number; is_hidden?: boolean } = {};
    if (num(data.price) !== undefined) patch.price = data.price;
    if (num(data.stock) !== undefined) patch.stock = Math.floor(data.stock!);
    if (typeof data.is_hidden === "boolean") patch.is_hidden = data.is_hidden;
    const { error } = await db.from("products").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminUpdateVariation = createServerFn({ method: "POST" })
  .inputValidator((d: Auth & { id: string; price?: number; stock?: number }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const patch: { price?: number; stock?: number } = {};
    if (num(data.price) !== undefined) patch.price = data.price;
    if (num(data.stock) !== undefined) patch.stock = Math.floor(data.stock!);
    const { error } = await db.from("product_variations").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

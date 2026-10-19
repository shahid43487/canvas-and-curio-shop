import { createServerFn } from "@tanstack/react-start";
import { pacmanConfigSchema, type PacmanConfig } from "./pacman-config";

type Auth = { token: string };
const ORDER_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

async function admin(token: string) {
  const expected = process.env["ADMIN_TOKEN"];
  if (!expected || typeof token !== "string") throw new Error("Wrong admin key");
  if (token !== expected) {
    const [expiry, nonce, signature] = token.split(".");
    if (!expiry || !nonce || !signature || Number(expiry) <= Date.now() || !/^[0-9a-f]{64}$/.test(signature)) throw new Error("Wrong admin key");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(expected), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const bytes = Uint8Array.from(signature.match(/../g) ?? [], b => parseInt(b, 16));
    if (!await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(`${expiry}.${nonce}`))) throw new Error("Wrong admin key");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminDashboard = createServerFn({ method: "POST" })
  .validator((d: Auth) => d)
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
  .validator((d: Auth) => d)
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
  .validator((d: Auth & { id: string; status?: string; payment_status?: "pending" | "paid" }) => {
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
  .validator((d: Auth) => d)
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
  .validator((d: Auth & { id: number; price?: number; stock?: number; is_hidden?: boolean }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const patch: { price?: number; stock?: number; is_hidden?: boolean } = {};
    if (num(data.price) !== undefined) patch.price = data.price!;
    if (num(data.stock) !== undefined) patch.stock = Math.floor(data.stock!);
    if (typeof data.is_hidden === "boolean") patch.is_hidden = data.is_hidden;
    const { error } = await db.from("products").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminUpdateVariation = createServerFn({ method: "POST" })
  .validator((d: Auth & { id: string; price?: number; stock?: number }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const patch: { price?: number; stock?: number } = {};
    if (num(data.price) !== undefined) patch.price = data.price!;
    if (num(data.stock) !== undefined) patch.stock = Math.floor(data.stock!);
    const { error } = await db.from("product_variations").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Catalog CRUD ----------
type ProductInput = {
  id?: number; num: string; name: string; price: number; stock: number; tag: string; color: string;
  material: string; dims: string; batch: string; description: string; image_key: string;
  is_hidden: boolean; requires_advance_payment: boolean;
};

export const adminListCatalog = createServerFn({ method: "POST" })
  .validator((d: Auth) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { data: products, error } = await db.from("products").select("*, product_variations(*)").order("id");
    if (error) throw error;
    return { products: products ?? [] };
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .validator((d: Auth & { product: ProductInput }) => {
    if (!d.product.name?.trim()) throw new Error("Name is required");
    if (num(d.product.price) === undefined || num(d.product.stock) === undefined) throw new Error("Price and stock must be finite and 0 or more");
    return d;
  })
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { id, ...p } = data.product;
    const row = { ...p, price: Number(p.price), stock: Math.floor(Number(p.stock)) };
    if (id) {
      const { error } = await db.from("products").update(row).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: max } = await db.from("products").select("id").order("id", { ascending: false }).limit(1).maybeSingle();
    const newId = Math.max((max?.id ?? 0) + 1, row.is_hidden ? 101 : 1);
    const { error } = await db.from("products").insert({ id: newId, ...row });
    if (error) throw error;
    return { id: newId };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .validator((d: Auth & { id: number }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { count } = await db.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", data.id);
    if (count) throw new Error("This product is in past orders — set stock to 0 or move it to the vault instead.");
    await db.from("product_variations").delete().eq("product_id", data.id);
    const { error } = await db.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminSaveVariation = createServerFn({ method: "POST" })
  .validator((d: Auth & { v: { id?: string | undefined; product_id: number; name: string; price: number; stock: number; display_order: number; button_config?: PacmanConfig } }) => {
    if (!d.v.name?.trim()) throw new Error("Option name is required");
    if (num(d.v.price) === undefined || num(d.v.stock) === undefined || num(d.v.display_order) === undefined) throw new Error("Price, stock and order must be finite and nonnegative");
    if (d.v.button_config) d.v.button_config = pacmanConfigSchema.parse(d.v.button_config);
    return d;
  })
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { id, ...v } = data.v;
    const row = { ...v, price: Number(v.price), stock: Math.floor(Number(v.stock)) };
    const { error } = id
      ? await db.from("product_variations").update(row).eq("id", id)
      : await db.from("product_variations").insert({ ...row, sku: `P${v.product_id}-${Date.now().toString(36)}` });
    if (error) throw error;
    await db.from("products").update({ selector_mode: "pacman" }).eq("id", v.product_id).eq("selector_mode", "none");
    return { ok: true };
  });

export const adminDeleteVariation = createServerFn({ method: "POST" })
  .validator((d: Auth & { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { count } = await db.from("order_items").select("id", { count: "exact", head: true }).eq("variation_id", data.id);
    const { error } = count
      ? await db.from("product_variations").update({ is_active: false }).eq("id", data.id)
      : await db.from("product_variations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Site settings (slides, socials, sound, stickers) ----------
export const adminSaveSetting = createServerFn({ method: "POST" })
  .validator((d: Auth & { key: "slides" | "socials" | "sound" | "stickers" | "dialogue" | "slideInterval"; value: unknown }) => {
    if (!["slides", "socials", "sound", "stickers", "dialogue", "slideInterval"].includes(d.key)) throw new Error("Unknown setting");
    if (d.key === "slideInterval" && (typeof d.value !== "number" || !Number.isFinite(d.value) || d.value < 2 || d.value > 15)) throw new Error("Slide duration must be 2–15 seconds");
    return d;
  })
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { error } = await db.from("site_settings").upsert({ key: data.key, value: data.value as never, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

// Upload: client gets a one-time upload URL, then asks for a long-lived read URL.
export const adminUploadUrl = createServerFn({ method: "POST" })
  .validator((d: Auth & { filename: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const path = `${Date.now().toString(36)}-${data.filename.replace(/[^\w.-]+/g, "_").slice(-60)}`;
    const { data: up, error } = await db.storage.from("media").createSignedUploadUrl(path);
    if (error) throw error;
    return { path, token: up.token };
  });

export const adminFileUrl = createServerFn({ method: "POST" })
  .validator((d: Auth & { path: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { data: s, error } = await db.storage.from("media").createSignedUrl(data.path, 60 * 60 * 24 * 365 * 10);
    if (error) throw error;
    return { url: s.signedUrl };
  });


// ---------- Customer coupons ----------
type CouponInput = { email: string; code: string; description: string; discount_type: "percent" | "fixed"; discount_value: number; min_order: number; expires_at: string | null };

export const adminListCoupons = createServerFn({ method: "POST" })
  .validator((d: Auth) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { data: coupons, error } = await db.from("customer_coupons").select("*").limit(200);
    if (error) throw error;
    const rows = coupons ?? [];
    const emails = new Map<string, string>();
    await Promise.all([...new Set(rows.map((c) => c.user_id))].map(async (id) => {
      const { data: u } = await db.auth.admin.getUserById(id);
      emails.set(id, u.user?.email ?? "unknown");
    }));
    return { coupons: rows.map((c) => ({ ...c, email: emails.get(c.user_id) ?? "unknown" })) };
  });

export const adminIssueCoupon = createServerFn({ method: "POST" })
  .validator((d: Auth & { coupon: CouponInput }) => {
    const c = d.coupon;
    if (!c.email?.trim()) throw new Error("Customer email is required");
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(c.code ?? "")) throw new Error("Code must be 3–32 letters, numbers, - or _");
    if (!["percent", "fixed"].includes(c.discount_type)) throw new Error("Bad discount type");
    if (typeof c.discount_value !== "number" || !Number.isFinite(c.discount_value) || c.discount_value <= 0) throw new Error("Discount must be more than 0");
    if (c.discount_type === "percent" && c.discount_value > 100) throw new Error("Percent discount cannot exceed 100");
    if (num(c.min_order) === undefined) throw new Error("Minimum order must be 0 or more");
    if (c.expires_at && Number.isNaN(Date.parse(c.expires_at))) throw new Error("Bad expiry date");
    return d;
  })
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const c = data.coupon;
    const { data: userId, error: lookupError } = await db.rpc("admin_find_user_by_email", { lookup: c.email });
    if (lookupError) throw lookupError;
    if (!userId) throw new Error("No customer with that email — they need to sign up first");
    const { error } = await db.from("customer_coupons").insert({
      user_id: userId, code: c.code.toUpperCase(), description: c.description.trim().slice(0, 200),
      discount_type: c.discount_type, discount_value: c.discount_value, min_order: c.min_order, expires_at: c.expires_at,
    });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .validator((d: Auth & { id: string }) => d)
  .handler(async ({ data }) => {
    const db = await admin(data.token);
    const { error } = await db.from("customer_coupons").delete().eq("id", data.id).is("used_at", null);
    if (error) throw error;
    return { ok: true };
  });

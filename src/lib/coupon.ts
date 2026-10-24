// Mirrors the discount rules in create_owned_order (migration 0006). The database
// is the source of truth for what is charged; this only powers the checkout preview.
export type CouponTerms = { discount_type: string; discount_value: number; min_order: number };

export const couponValueLabel = (c: Pick<CouponTerms, "discount_type" | "discount_value">, money: (n: number) => string) =>
  c.discount_value <= 0 ? "No discount set" : c.discount_type === "percent" ? `${c.discount_value}% off` : `${money(c.discount_value)} off`;

export type CouponStatus = "active" | "used" | "expired";
export const couponStatus = (c: { used_at: string | null; expires_at: string | null }): CouponStatus =>
  c.used_at ? "used" : c.expires_at && new Date(c.expires_at).getTime() < Date.now() ? "expired" : "active";

// Artwork is derived from the coupon's terms so no extra database column is needed.
// "bogo" is not priced by the discount engine; it is used by the admin design gallery
// and campaigns that grant it manually.
export type CouponDesign = "smile" | "ticket" | "ship" | "bogo" | "dark" | "ghost";
export const couponDesign = (c: Pick<CouponTerms, "discount_type" | "discount_value">): CouponDesign =>
  c.discount_type === "percent" ? (c.discount_value <= 10 ? "smile" : c.discount_value <= 25 ? "ticket" : "ghost") : c.discount_value >= 500 ? "dark" : "ship";

export type CouponArtText = { lines: string[]; note: string };
export function couponArtText(c: CouponTerms, money: (n: number) => string): CouponArtText {
  const lines = c.discount_type === "percent" ? [`${c.discount_value}%`, "OFF"] : [`FLAT ${c.discount_value} TK`, "OFF"];
  return { lines, note: c.min_order > 0 ? `ON ORDERS ABOVE ${money(c.min_order)}` : "ON YOUR NEXT ORDER" };
}

export function couponDiscount(terms: CouponTerms, subtotal: number): number {
  if (terms.discount_value <= 0) throw new Error("Coupon has no discount value");
  if (subtotal < terms.min_order) throw new Error("Order total is below the coupon minimum");
  const raw = terms.discount_type === "percent" ? Math.round(subtotal * terms.discount_value) / 100 : terms.discount_value;
  return Math.min(subtotal, raw);
}

// Mirrors the discount rules in create_owned_order (migration 0006). The database
// is the source of truth for what is charged; this only powers the checkout preview.
export type CouponTerms = { discount_type: string; discount_value: number; min_order: number };

export const couponValueLabel = (c: Pick<CouponTerms, "discount_type" | "discount_value">, money: (n: number) => string) =>
  c.discount_value <= 0 ? "No discount set" : c.discount_type === "percent" ? `${c.discount_value}% off` : `${money(c.discount_value)} off`;

export function couponDiscount(terms: CouponTerms, subtotal: number): number {
  if (terms.discount_value <= 0) throw new Error("Coupon has no discount value");
  if (subtotal < terms.min_order) throw new Error("Order total is below the coupon minimum");
  const raw = terms.discount_type === "percent" ? Math.round(subtotal * terms.discount_value) / 100 : terms.discount_value;
  return Math.min(subtotal, raw);
}

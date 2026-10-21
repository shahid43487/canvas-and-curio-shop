import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAccount } from "@/lib/account.functions";
import { couponArtText, couponDesign, couponStatus, couponValueLabel } from "@/lib/coupon";
import { formatPrice } from "@/data/products";
import { CouponArt } from "./CouponArt";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  busy: boolean;
  appliedCode: string | null;
  /** Resolves true when the coupon was accepted, so the panel can close. */
  onApply: (code: string) => Promise<boolean>;
};

// Desktop: centred modal. Phones: full-screen sheet (see .coupon-panel in styles.css).
export function CouponPanel({ open, onOpenChange, subtotal, busy, appliedCode, onApply }: Props) {
  const [code, setCode] = useState("");
  const account = useQuery({ queryKey: ["customer-account"], queryFn: () => getAccount(), enabled: open, staleTime: 30_000 });
  const available = (account.data?.coupons ?? []).filter((c) => couponStatus(c) === "active");

  const apply = async (value: string) => {
    if (!value.trim() || busy) return;
    if (await onApply(value.trim())) { setCode(""); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="coupon-panel">
        <DialogTitle className="coupon-panel-title">Apply Coupon</DialogTitle>
        <DialogDescription className="sr-only">Enter a coupon code or pick one of your available coupons.</DialogDescription>
        <form className="coupon-entry" onSubmit={(e) => { e.preventDefault(); void apply(code); }}>
          <Input aria-label="Coupon code" placeholder="Enter coupon code" value={code} maxLength={64} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" disabled={busy || !code.trim()}>{busy ? "…" : "Apply"}</Button>
        </form>

        <div className="coupon-list-head"><h3>Available Coupons</h3><span>{available.length} available</span></div>
        <div className="coupon-list">
          {account.isLoading && <p className="coupon-empty">Loading your coupons…</p>}
          {account.isError && <p className="coupon-empty">Couldn’t load your coupons. You can still type a code above.</p>}
          {account.data && available.length === 0 && <p className="coupon-empty">No coupons on your account right now.</p>}
          {available.map((c) => {
            const terms = { discount_type: c.discount_type, discount_value: Number(c.discount_value), min_order: Number(c.min_order) };
            const art = couponArtText(terms, formatPrice);
            const short = Math.max(0, terms.min_order - subtotal);
            const isApplied = appliedCode?.toUpperCase() === c.code.toUpperCase();
            return (
              <article key={c.id} className="coupon-item">
                <CouponArt compact className="ca-thumb" design={couponDesign(terms)} lines={art.lines.slice(0, 2)} note={art.note} code={c.code} />
                <div className="coupon-item-body">
                  <b>{c.code}</b>
                  <span>{c.description || couponValueLabel(terms, formatPrice)}</span>
                  <small>
                    {terms.min_order > 0 ? `Min. order ${formatPrice(terms.min_order)}` : "No minimum"}
                    {c.expires_at ? ` · valid until ${new Date(c.expires_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  </small>
                  {short > 0 && <small className="coupon-short">Add {formatPrice(short)} more to use this</small>}
                </div>
                <Button type="button" className="coupon-apply" disabled={busy || short > 0 || isApplied} onClick={() => void apply(c.code)}>{isApplied ? "Applied" : "Apply"}</Button>
              </article>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

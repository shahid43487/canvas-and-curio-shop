import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminIssueCoupon } from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-session";
import { pageHead } from "@/lib/page-head";
import { couponArtText, type CouponDesign } from "@/lib/coupon";
import { CouponArt } from "@/components/smol/CouponArt";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/admin/card-library")({
  head: () => pageHead("Coupon Library", "Create and issue store coupons from the animated collectible-card gallery."),
  component: CouponLibrary,
});

type Draft = {
  email: string;
  code: string;
  type: "percent" | "fixed";
  value: string;
  min: string;
  expires: string;
  description: string;
};
const EMPTY: Draft = { email: "", code: "", type: "percent", value: "", min: "0", expires: "", description: "" };

type GalleryTemplate = {
  design: CouponDesign;
  name: string;
  tagline: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min: number;
  description: string;
};

// One gallery entry per animated collectible design (src/lib/coupon.ts mapping).
// "bogo" is not priced by the discount engine — it stays gallery-only.
const GALLERY: GalleryTemplate[] = [
  { design: "smile", name: "Smiley Starter", tagline: "Cheerful welcome card", code: "SMILEY10", type: "percent", value: 10, min: 0, description: "10% off your next order" },
  { design: "ticket", name: "Meowchiato", tagline: "Retro café ticket", code: "MEOWCHIATO15", type: "percent", value: 15, min: 0, description: "15% off — paws off my coffee" },
  { design: "ghost", name: "Boba Phantom", tagline: "Spooky sipping ghost", code: "BOBA20", type: "percent", value: 20, min: 0, description: "20% off, no strings attached" },
  { design: "ship", name: "Parcel Pal", tagline: "Delivery-truck card", code: "PARCEL250", type: "fixed", value: 250, min: 500, description: "Flat 250 TK off orders above 500 TK" },
  { design: "dark", name: "Midnight Dragon", tagline: "TCG relic card", code: "DRAGON500", type: "fixed", value: 500, min: 1000, description: "Flat 500 TK off big orders" },
  { design: "bogo", name: "One Gets One", tagline: "Buy one get one", code: "BOGO1", type: "percent", value: 0, min: 0, description: "Buy one get one — grant manually or via campaigns" },
];

function CouponLibrary() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const applyTemplate = (t: GalleryTemplate) => {
    set({ code: t.code, type: t.type, value: String(t.value), min: String(t.min), description: t.description });
    toast.success(`${t.name} design applied — adjust the terms and issue`);
  };

  const createCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await adminIssueCoupon({
        data: {
          token,
          coupon: {
            email: draft.email.trim(),
            code: draft.code.trim().toUpperCase(),
            description: draft.description.trim(),
            discount_type: draft.type,
            discount_value: Number(draft.value),
            min_order: Number(draft.min || 0),
            expires_at: draft.expires ? new Date(draft.expires + "T23:59:59").toISOString() : null,
          },
        },
      });
      toast.success("Coupon created and issued");
      setDraft(EMPTY);
      await qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create coupon");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 980 }}>
      <div className="admin-row">
        <div>
          <h1 className="admin-h1" style={{ marginBottom: 0 }}>Coupon Library</h1>
          <small>Create and issue coupons here. Pick an animated collectible card design below — every card's layers move, and choosing one pre-fills the discount terms.</small>
        </div>
      </div>
      <div className="admin-panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Collectible card gallery</h2>
        <p><small>Every design is a fully animated card (bobbing, blinking, floating, spinning). Pick one to auto-fill the coupon terms, then issue it.</small></p>
        <div className="admin-card-gallery">
          {GALLERY.map((t) => {
            const art = t.design === "bogo"
              ? { lines: ["BUY 1", "GET 1"], note: "SELECT STYLES ONLY" }
              : couponArtText({ discount_type: t.type, discount_value: t.value, min_order: t.min }, formatPrice);
            return (
              <article className="admin-card-card" key={t.design}>
                <div className="admin-card-art"><CouponArt design={t.design} lines={art.lines} note={art.note} code={t.code} /></div>
                <strong>{t.name}</strong>
                <small>{t.tagline}</small>
                {t.design === "bogo"
                  ? <small className="admin-card-note">Gallery only — not priced at checkout</small>
                  : <button type="button" className="admin-btn" onClick={() => applyTemplate(t)}>Use this design</button>}
              </article>
            );
          })}
        </div>
      </div>
      <div className="admin-panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Create coupon</h2>
        <p><small>Enter the customer's email, discount terms, and optional expiry. The coupon will be issued to that customer and appear in Coupons.</small></p>
        <form onSubmit={createCoupon} className="admin-form">
          <label>Customer email
            <input className="admin-input" type="email" required value={draft.email} onChange={(event) => set({ email: event.target.value })} placeholder="customer@example.com" />
          </label>
          <label>Coupon code
            <input className="admin-input" required pattern="[A-Za-z0-9_-]{3,32}" value={draft.code} onChange={(event) => set({ code: event.target.value.toUpperCase() })} placeholder="WELCOME10" />
          </label>
          <label>Discount type
            <select className="admin-input" value={draft.type} onChange={(event) => set({ type: event.target.value as Draft["type"] })}>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </label>
          <label>{draft.type === "percent" ? "Percent off (1–100)" : "Amount off"}
            <input className="admin-input" type="number" step="0.01" min="0.01" max={draft.type === "percent" ? 100 : undefined} required value={draft.value} onChange={(event) => set({ value: event.target.value })} />
          </label>
          <label>Minimum order
            <input className="admin-input" type="number" step="0.01" min="0" value={draft.min} onChange={(event) => set({ min: event.target.value })} />
          </label>
          <label>Expiry date (optional)
            <input className="admin-input" type="date" value={draft.expires} onChange={(event) => set({ expires: event.target.value })} />
          </label>
          <label>Description (optional)
            <input className="admin-input" maxLength={200} value={draft.description} onChange={(event) => set({ description: event.target.value })} placeholder="Shown to the customer" />
          </label>
          <div>
            <button className="admin-btn" disabled={busy}>{busy ? "Creating…" : "Create and issue coupon"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminIssueCoupon } from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-session";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/admin/coupon-library")({
  head: () => pageHead("Coupon Library", "Create and issue store coupons."),
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

function CouponLibrary() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

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
          <small>Create and issue coupons here. Coupon design templates and collectible-card artwork have been removed.</small>
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

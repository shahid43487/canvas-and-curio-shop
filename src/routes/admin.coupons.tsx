import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { pageHead } from "@/lib/page-head";
import { adminDeleteCoupon, adminIssueCoupon, adminListCoupons } from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-session";
import { couponArtText, couponDesign, couponStatus, couponValueLabel, type CouponDesign, type CouponStatus } from "@/lib/coupon";
import { formatPrice } from "@/data/products";
import { CouponArt } from "@/components/smol/CouponArt";

export const Route = createFileRoute("/admin/coupons")({ head: () => pageHead("Coupons", "SMOL STUUF coupon administration."), component: Coupons });

type Draft = { email: string; code: string; type: "percent" | "fixed"; value: string; min: string; expires: string; description: string };
const EMPTY: Draft = { email: "", code: "", type: "percent", value: "", min: "0", expires: "", description: "" };
const STATUS_LABEL: Record<CouponStatus, string> = { active: "Active", used: "Used", expired: "Expired" };

// Reference gallery of the five coupon looks. Real coupons pick one from their terms.
const GALLERY: { design: CouponDesign; lines: string[]; note: string; code: string; valid: string }[] = [
  { design: "smile", lines: ["10%", "OFF"], note: "ON YOUR NEXT ORDER", code: "SMOL10", valid: "30 Jun 2025" },
  { design: "ship", lines: ["FREE", "SHIPPING"], note: "ON ORDERS ABOVE 1200 TK", code: "FREESHIP", valid: "30 Jun 2025" },
  { design: "bogo", lines: ["BUY 2", "GET 1 FREE"], note: "ON SELECTED ITEMS", code: "B2G1", valid: "30 Jun 2025" },
  { design: "dark", lines: ["FLAT", "500 TK", "OFF"], note: "ON ORDERS ABOVE 2000 TK", code: "FLAT500", valid: "30 Jun 2025" },
  { design: "ghost", lines: ["15%", "OFF"], note: "ON YOUR FIRST ORDER", code: "FIRST15", valid: "30 Jun 2025" },
];

function Coupons() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [formOpen, setFormOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CouponStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "percent" | "fixed">("all");
  const { data, error, isLoading } = useQuery({ queryKey: ["admin", "coupons", token], enabled: Boolean(token), retry: false, queryFn: () => adminListCoupons({ data: { token } }) });
  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const coupons = data?.coupons ?? [];
  const counts = useMemo(() => {
    const n: Record<CouponStatus, number> = { active: 0, used: 0, expired: 0 };
    for (const c of coupons) n[couponStatus(c)] += 1;
    return n;
  }, [coupons]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return coupons.filter((c) =>
      (statusFilter === "all" || couponStatus(c) === statusFilter) &&
      (typeFilter === "all" || c.discount_type === typeFilter) &&
      (!needle || c.code.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle)));
  }, [coupons, q, statusFilter, typeFilter]);
  const filtered = q !== "" || statusFilter !== "all" || typeFilter !== "all";

  const issue = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await adminIssueCoupon({
        data: {
          token,
          coupon: {
            email: draft.email,
            code: draft.code,
            description: draft.description,
            discount_type: draft.type,
            discount_value: Number(draft.value),
            min_order: Number(draft.min || 0),
            expires_at: draft.expires ? new Date(`${draft.expires}T23:59:59`).toISOString() : null,
          },
        },
      });
      toast.success("Coupon issued");
      setDraft(EMPTY);
      setFormOpen(false);
      await qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not issue coupon");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this unused coupon?")) return;
    try {
      await adminDeleteCoupon({ data: { token, id } });
      await qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    }
  };

  const duplicate = (c: (typeof coupons)[number]) => {
    setDraft({
      email: "",
      code: "",
      type: c.discount_type === "fixed" ? "fixed" : "percent",
      value: String(c.discount_value),
      min: String(c.min_order),
      expires: c.expires_at ? c.expires_at.slice(0, 10) : "",
      description: c.description,
    });
    setFormOpen(true);
    toast.success("Copied into the form — add a customer email and a new code");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const previewTerms = { discount_type: draft.type, discount_value: Number(draft.value) || 0, min_order: Number(draft.min) || 0 };
  const previewText = couponArtText(previewTerms, formatPrice);

  return (
    <>
      <div className="admin-row">
        <div>
          <h1 className="admin-h1" style={{ marginBottom: 0 }}>Coupons</h1>
          <small>Create, manage and track discount codes for your store.</small>
        </div>
        <button type="button" className="admin-btn" style={{ marginLeft: "auto" }} onClick={() => setFormOpen((o) => !o)}>{formOpen ? "Close" : "+ Create Coupon"}</button>
      </div>

      <div className="admin-tiles coupon-tiles">
        <div className="admin-tile"><span>Total coupons</span><b>{coupons.length}</b></div>
        <div className="admin-tile"><span>● Active</span><b>{counts.active}</b></div>
        <div className="admin-tile"><span>● Used</span><b>{counts.used}</b></div>
        <div className="admin-tile"><span>● Expired</span><b>{counts.expired}</b></div>
      </div>

      {formOpen && (
        <form className="admin-panel" onSubmit={issue}>
          <h2>Issue a coupon</h2>
          <p><small>The customer must already have an account. The discount is applied to item prices when they place a pending order, and returns to them if they cancel it.</small></p>
          <div className="coupon-form-grid">
            <div className="admin-form">
              <label>Customer email<input className="admin-input" type="email" required value={draft.email} onChange={(e) => set({ email: e.target.value })} /></label>
              <label>Code<input className="admin-input" required pattern="[A-Za-z0-9_\-]{3,32}" placeholder="WELCOME10" value={draft.code} onChange={(e) => set({ code: e.target.value })} /></label>
              <label>Type
                <select className="admin-input" value={draft.type} onChange={(e) => set({ type: e.target.value as Draft["type"] })}>
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </label>
              <label>{draft.type === "percent" ? "Percent (1–100)" : "Amount"}<input className="admin-input" type="number" step="0.01" min="0.01" max={draft.type === "percent" ? 100 : undefined} required value={draft.value} onChange={(e) => set({ value: e.target.value })} /></label>
              <label>Minimum order<input className="admin-input" type="number" step="0.01" min="0" value={draft.min} onChange={(e) => set({ min: e.target.value })} /></label>
              <label>Expires (optional)<input className="admin-input" type="date" value={draft.expires} onChange={(e) => set({ expires: e.target.value })} /></label>
              <label className="wide">Description<input className="admin-input" maxLength={200} placeholder="Shown to the customer" value={draft.description} onChange={(e) => set({ description: e.target.value })} /></label>
            </div>
            <div className="coupon-form-preview">
              <small>Preview — the design follows the discount</small>
              <CouponArt design={couponDesign(previewTerms)} lines={previewText.lines} note={previewText.note} code={draft.code.toUpperCase() || "YOURCODE"} valid={draft.expires ? new Date(`${draft.expires}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null} />
            </div>
          </div>
          <button className="admin-btn">Issue coupon</button>
        </form>
      )}

      <div className="admin-panel coupon-filters">
        <input className="admin-input" type="search" aria-label="Search coupons" placeholder="Search code or customer…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="admin-input" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option><option value="active">Active</option><option value="used">Used</option><option value="expired">Expired</option>
        </select>
        <select className="admin-input" aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
          <option value="all">All types</option><option value="percent">Percentage</option><option value="fixed">Fixed amount</option>
        </select>
        <button type="button" className="admin-btn ghost" onClick={() => { setQ(""); setStatusFilter("all"); setTypeFilter("all"); }}>Reset</button>
      </div>

      {isLoading && <p>Loading…</p>}
      {error && <p className="admin-error">{error instanceof Error ? error.message : "Could not load coupons"}</p>}
      {data && (
        <div className="coupon-table-wrap">
          <table className="admin-table coupon-table">
            <thead><tr><th>Code</th><th>Customer</th><th>Type</th><th>Value</th><th>Min. order</th><th>Status</th><th>Valid until</th><th>Uses</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={9}>{filtered ? "No coupons match these filters." : "No coupons yet."}</td></tr>}
              {rows.map((c) => {
                const terms = { discount_type: c.discount_type, discount_value: Number(c.discount_value), min_order: Number(c.min_order) };
                const art = couponArtText(terms, formatPrice);
                const st = couponStatus(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="coupon-code-cell">
                        <CouponArt compact className="ca-thumb" design={couponDesign(terms)} lines={art.lines.slice(0, 2)} note={art.note} code={c.code} />
                        <div><b>{c.code}</b><br /><small>{couponValueLabel(terms, formatPrice)}</small></div>
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.discount_type === "percent" ? "Percentage" : "Fixed amount"}</td>
                    <td>{c.discount_type === "percent" ? `${Number(c.discount_value)}%` : formatPrice(Number(c.discount_value))}</td>
                    <td>{Number(c.min_order) > 0 ? formatPrice(Number(c.min_order)) : "—"}</td>
                    <td><span className={`coupon-chip chip-${st}`}>{STATUS_LABEL[st]}</span></td>
                    <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                    <td>{c.used_at ? "1" : "0"} / 1</td>
                    <td className="coupon-actions">
                      <button type="button" className="admin-btn ghost" aria-label={`Duplicate ${c.code}`} title="Duplicate" onClick={() => duplicate(c)}><Copy size={14} /></button>
                      {!c.used_at && <button type="button" className="admin-btn danger" aria-label={`Delete ${c.code}`} title="Delete" onClick={() => void remove(c.id)}><Trash2 size={14} /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <small>Showing {rows.length} of {coupons.length} coupons</small>
        </div>
      )}

      <section className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <h2>Coupon designs</h2>
        <p><small>Different styles for different campaigns. Percent coupons use the cream or pink look, fixed amounts use the black or red look. The white and free-shipping looks are for future campaign types.</small></p>
        <div className="coupon-gallery">
          {GALLERY.map((g) => <CouponArt key={g.design} {...g} />)}
        </div>
      </section>
    </>
  );
}

import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { pageHead } from "@/lib/page-head";
import { adminDeleteCoupon, adminGrantCouponToCustomers, adminIssueCoupon, adminListCoupons, adminListCustomers } from "@/lib/admin.functions";
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
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantCouponId, setGrantCouponId] = useState("");
  const [grantMode, setGrantMode] = useState<"all" | "selected">("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [grantBusy, setGrantBusy] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "percent" | "fixed">("all");
  const { data, error, isLoading } = useQuery({ queryKey: ["admin", "coupons", token], enabled: Boolean(token), retry: false, queryFn: () => adminListCoupons({ data: { token } }) });
  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const { data: customerData, error: customerError, isLoading: customersLoading } = useQuery({ queryKey: ["admin", "coupon-customers", token], enabled: Boolean(token && grantOpen), retry: false, queryFn: () => adminListCustomers({ data: { token } }) });

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
  const grantTemplates = coupons.filter((c) => couponStatus(c) === "active" && !c.used_at);
  const selectedTemplate = grantTemplates.find((c) => c.id === grantCouponId);
  const customerRows = (customerData?.customers ?? []).filter((c) => !customerSearch.trim() || `${c.email} ${c.display_name}`.toLowerCase().includes(customerSearch.trim().toLowerCase()));
  const grantTargetCount = grantMode === "all" ? (customerData?.customers.length ?? 0) : selectedCustomerIds.length;

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


  const grantCoupons = async () => {
    if (!selectedTemplate) {
      toast.error("Choose an active coupon first");
      return;
    }
    if (grantMode === "selected" && selectedCustomerIds.length === 0) {
      toast.error("Select at least one customer");
      return;
    }
    const targetCount = grantMode === "all" ? (customerData?.customers.length ?? 0) : selectedCustomerIds.length;
    if (targetCount === 0) {
      toast.error("There are no customers to grant this coupon to");
      return;
    }
    if (!confirm(`Grant ${selectedTemplate.code} to ${targetCount} customer${targetCount === 1 ? "" : "s"}? Anyone who already has this code will be skipped.`)) return;
    setGrantBusy(true);
    try {
      const result = await adminGrantCouponToCustomers({
        data: {
          token,
          couponId: selectedTemplate.id,
          allCustomers: grantMode === "all",
          userIds: grantMode === "selected" ? selectedCustomerIds : [],
        },
      });
      toast.success(`Coupon granted to ${result.granted}; ${result.skipped} skipped.`);
      setSelectedCustomerIds([]);
      setGrantOpen(false);
      await qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not grant coupons");
    } finally {
      setGrantBusy(false);
    }
  };

  const toggleCustomer = (id: string) => {
    setSelectedCustomerIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
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


      <section className="admin-panel" style={{ marginBottom: "1rem" }}>
        <div className="admin-row">
          <div>
            <h2 style={{ margin: 0 }}>Grant coupons</h2>
            <small>Send an existing active coupon to everyone or selected customer accounts.</small>
          </div>
          <button type="button" className="admin-btn" style={{ marginLeft: "auto" }} onClick={() => setGrantOpen((open) => !open)}>{grantOpen ? "Close grant tools" : "Grant coupons"}</button>
        </div>
        {grantOpen && (
          <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
            <label className="admin-form">Coupon to grant
              <select className="admin-input" value={grantCouponId} onChange={(e) => setGrantCouponId(e.target.value)} required>
                <option value="">Choose an active coupon…</option>
                {grantTemplates.map((c) => <option key={c.id} value={c.id}>{c.code} — {couponValueLabel({ discount_type: c.discount_type, discount_value: Number(c.discount_value), min_order: Number(c.min_order) }, formatPrice)}{c.description ? ` · ${c.description}` : ""}</option>)}
              </select>
              {grantTemplates.length === 0 && <small>No active unused coupon templates are available. Create or activate a coupon first.</small>}
            </label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                <input type="radio" name="grant-mode" checked={grantMode === "all"} onChange={() => setGrantMode("all")} />
                Everyone ({customerData?.customers.length ?? (customersLoading ? "…" : 0)})
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                <input type="radio" name="grant-mode" checked={grantMode === "selected"} onChange={() => setGrantMode("selected")} />
                Selected customers ({selectedCustomerIds.length})
              </label>
            </div>
            {grantMode === "all" ? (
              <p><small>The coupon will be added to every registered customer account. Customers who already have this code will not receive a duplicate.</small></p>
            ) : (
              <div style={{ display: "grid", gap: ".75rem" }}>
                <input className="admin-input" type="search" aria-label="Search customers" placeholder="Search customers by name or email…" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  <button type="button" className="admin-btn ghost" onClick={() => setSelectedCustomerIds((current) => [...new Set([...current, ...customerRows.map((c) => c.id)])])} disabled={customerRows.length === 0}>Select visible</button>
                  <button type="button" className="admin-btn ghost" onClick={() => setSelectedCustomerIds([])} disabled={selectedCustomerIds.length === 0}>Clear selection</button>
                  <small style={{ alignSelf: "center" }}>{selectedCustomerIds.length} selected</small>
                </div>
                <div style={{ maxHeight: "18rem", overflowY: "auto", border: "1px solid var(--admin-border, #ddd)", borderRadius: ".5rem", padding: ".25rem .75rem" }}>
                  {customersLoading && <p>Loading customers…</p>}
                  {customerError && <p className="admin-error">{customerError instanceof Error ? customerError.message : "Could not load customers"}</p>}
                  {!customersLoading && !customerError && customerRows.length === 0 && <p><small>No customers match that search.</small></p>}
                  {customerRows.map((customer) => (
                    <label key={customer.id} style={{ display: "flex", alignItems: "center", gap: ".65rem", padding: ".6rem 0", borderBottom: "1px solid var(--admin-border, #eee)", cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedCustomerIds.includes(customer.id)} onChange={() => toggleCustomer(customer.id)} />
                      <span style={{ display: "grid", minWidth: 0 }}>
                        <b style={{ overflowWrap: "anywhere" }}>{customer.display_name || customer.email}</b>
                        <small>{customer.email}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
              <button type="button" className="admin-btn" onClick={() => void grantCoupons()} disabled={grantBusy || !selectedTemplate || grantTargetCount === 0 || (grantMode === "selected" && (selectedCustomerIds.length === 0 || customersLoading || Boolean(customerError)))}>
                {grantBusy ? "Granting…" : `Grant to ${grantMode === "all" ? "everyone" : `${selectedCustomerIds.length} selected`}`}
              </button>
              <small>{grantTargetCount} target{grantTargetCount === 1 ? "" : "s"} · duplicates will be skipped</small>
            </div>
          </div>
        )}
      </section>

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

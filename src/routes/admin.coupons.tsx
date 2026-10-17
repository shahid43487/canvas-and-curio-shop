import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pageHead } from "@/lib/page-head";
import { adminDeleteCoupon, adminIssueCoupon, adminListCoupons } from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-session";
import { couponValueLabel } from "@/lib/coupon";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/admin/coupons")({ head: () => pageHead("Coupons", "SMOL STUUF coupon administration."), component: Coupons });

function Coupons() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const { data, error, isLoading } = useQuery({ queryKey: ["admin", "coupons", token], enabled: Boolean(token), retry: false, queryFn: () => adminListCoupons({ data: { token } }) });

  const issue = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const expires = String(f.get("expires") ?? "");
    try {
      await adminIssueCoupon({
        data: {
          token,
          coupon: {
            email: String(f.get("email") ?? ""),
            code: String(f.get("code") ?? ""),
            description: String(f.get("description") ?? ""),
            discount_type: type,
            discount_value: Number(f.get("value")),
            min_order: Number(f.get("min") || 0),
            expires_at: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
          },
        },
      });
      toast.success("Coupon issued");
      form.reset();
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

  const status = (c: { used_at: string | null; expires_at: string | null }) =>
    c.used_at ? "Used" : c.expires_at && new Date(c.expires_at) < new Date() ? "Expired" : "Available";

  return (
    <>
      <h1 className="admin-h1">Coupons</h1>
      <form className="admin-panel" onSubmit={issue}>
        <h2>Issue a coupon</h2>
        <p><small>The customer must already have an account. The discount is applied to item prices when they place a pending order, and returns to them if they cancel it.</small></p>
        <div className="admin-form">
          <label>Customer email<input className="admin-input" name="email" type="email" required /></label>
          <label>Code<input className="admin-input" name="code" required pattern="[A-Za-z0-9_\-]{3,32}" placeholder="WELCOME10" /></label>
          <label>Type
            <select className="admin-input" value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </label>
          <label>{type === "percent" ? "Percent (1–100)" : "Amount"}<input className="admin-input" name="value" type="number" step="0.01" min="0.01" max={type === "percent" ? 100 : undefined} required /></label>
          <label>Minimum order<input className="admin-input" name="min" type="number" step="0.01" min="0" defaultValue="0" /></label>
          <label>Expires (optional)<input className="admin-input" name="expires" type="date" /></label>
          <label className="wide">Description<input className="admin-input" name="description" maxLength={200} placeholder="Shown to the customer" /></label>
        </div>
        <button className="admin-btn">Issue coupon</button>
      </form>

      {isLoading && <p>Loading…</p>}
      {error && <p className="admin-error">{error instanceof Error ? error.message : "Could not load coupons"}</p>}
      {data && (
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Code</th><th>Value</th><th>Min order</th><th>Expires</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data.coupons.length === 0 && <tr><td colSpan={7}>No coupons yet.</td></tr>}
            {data.coupons.map((c) => (
              <tr key={c.id}>
                <td>{c.email}</td>
                <td>{c.code}</td>
                <td>{couponValueLabel(c, formatPrice)}</td>
                <td>{Number(c.min_order) > 0 ? formatPrice(Number(c.min_order)) : "—"}</td>
                <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                <td>{status(c)}</td>
                <td>{!c.used_at && <button className="admin-btn danger" onClick={() => void remove(c.id)}>Delete</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

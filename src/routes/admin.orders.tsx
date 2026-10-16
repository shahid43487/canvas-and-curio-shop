import { Fragment, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminListOrders, adminUpdateOrder } from "@/lib/admin.functions";
import { formatPrice } from "@/data/products";
import { useAdminToken } from "./admin";

export const Route = createFileRoute("/admin/orders")({ component: Orders });

const STATUSES = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

function Orders() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const { data } = useQuery({ queryKey: ["admin", "orders"], queryFn: () => adminListOrders({ data: { token } }) });

  const update = async (id: string, patch: { status?: string; payment_status?: "paid" }) => {
    try {
      await adminUpdateOrder({ data: { token, id, ...patch } });
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const orders = (data?.orders ?? []).filter((o) => filter === "all" || o.status === filter);
  return (
    <>
      <h1 className="admin-h1">Orders</h1>
      <div className="admin-pills">
        {STATUSES.map((s) => <button key={s} className={filter === s ? "admin-btn" : "admin-btn ghost"} onClick={() => setFilter(s)}>{s}</button>)}
      </div>
      <table className="admin-table">
        <thead><tr><th>When</th><th>Customer</th><th>Pay</th><th>TrxID</th><th>Total</th><th>Status</th><th /></tr></thead>
        <tbody>
          {orders.map((o) => (
            <Fragment key={o.id}>
              <tr>
                <td>{new Date(o.created_at).toLocaleString()}{o.order_source === "secret" && " 🤫"}</td>
                <td>{o.shipping_name}<br /><small>{o.shipping_phone}</small></td>
                <td>{o.payment_method} · {o.payment_status}</td>
                <td>{o.bkash_transaction_id ? <button className="admin-btn ghost" onClick={() => { navigator.clipboard.writeText(o.bkash_transaction_id!); toast.success("Copied"); }}>{o.bkash_transaction_id}</button> : "—"}</td>
                <td>{formatPrice(Number(o.total_amount))}</td>
                <td>
                  <select className="admin-input" value={o.status} onChange={(e) => update(o.id, { status: e.target.value })}>
                    {STATUSES.slice(1).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  {o.payment_method === "bkash" && o.payment_status === "pending" && (
                    <button className="admin-btn" onClick={() => update(o.id, { payment_status: "paid", status: "confirmed" })}>Verify paid</button>
                  )}
                  <button className="admin-btn ghost" onClick={() => setOpen(open === o.id ? null : o.id)}>Haul</button>
                </td>
              </tr>
              {open === o.id && (
                <tr ><td colSpan={7} className="admin-slip">
                  <b>PACKING SLIP · SMOL STUUF</b>
                  <p>{o.shipping_name} · {o.shipping_phone}<br />{o.shipping_address}, {o.shipping_city}{o.shipping_notes && <><br />Note: {o.shipping_notes}</>}</p>
                  <ul>{o.order_items.map((it, i) => <li key={i}>{it.quantity} × {it.products?.name}{it.product_variations?.name ? ` · ${it.product_variations.name}` : ""} — {formatPrice(Number(it.unit_price) * it.quantity)}</li>)}</ul>
                  <p>Handle with chaos. Babu Rao approved.</p>
                  <button className="admin-btn ghost" onClick={() => window.print()}>Print</button>
                </td></tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}

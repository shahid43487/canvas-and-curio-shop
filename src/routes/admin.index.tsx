import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminDashboard } from "@/lib/admin.functions";
import { formatPrice } from "@/data/products";
import { useAdminToken } from "@/lib/admin-session";

export const Route = createFileRoute("/admin/")({ head: () => pageHead("Operations", "SMOL STUUF operations administration."), component: Dashboard });

function Dashboard() {
  const token = useAdminToken();
  const { data } = useQuery({ queryKey: ["admin", "dash", token], enabled: Boolean(token), retry: false, queryFn: () => adminDashboard({ data: { token } }) });
  if (!data) return <p>Warming up…</p>;
  return (
    <>
      <h1 className="admin-h1">Operations</h1>
      <div className="admin-tiles">
        <Tile label="Revenue today" value={formatPrice(data.revenueToday)} />
        <Tile label="Orders today" value={data.ordersToday} />
        <Tile label="bKash to verify" value={data.pendingBkash} hot={data.pendingBkash > 0} />
        <Tile label="Low stock" value={data.lowStock.length} hot={data.lowStock.length > 0} />
      </div>
      {data.lowStock.length > 0 && (
        <section className="admin-panel"><h2>Low stock</h2>
          {data.lowStock.map((s, i) => <p key={i}>{s.name} — <b>{s.stock}</b> left</p>)}
        </section>
      )}
      <section className="admin-panel"><h2>Recent orders</h2>
        <table className="admin-table"><tbody>
          {data.recent.map((o) => (
            <tr key={o.id}><td>{new Date(o.created_at).toLocaleString()}</td><td>{o.shipping_name}</td><td>{o.payment_method}/{o.payment_status}</td><td>{o.status}</td><td>{formatPrice(Number(o.total_amount))}</td></tr>
          ))}
        </tbody></table>
      </section>
    </>
  );
}

function Tile({ label, value, hot }: { label: string; value: string | number; hot?: boolean }) {
  return <div className="admin-tile"><span className={hot ? "admin-led on" : "admin-led"} /><small>{label}</small><b>{value}</b></div>;
}

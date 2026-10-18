import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { Button } from "@/components/ui/button";
import { getAccount, cancelOrder, saveProfile } from "@/lib/account.functions";
import { pageHead } from "@/lib/page-head";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/products";
import { couponValueLabel } from "@/lib/coupon";

const accountQuery = queryOptions({ queryKey: ["customer-account"], queryFn: () => getAccount() });
export const Route = createFileRoute("/_authenticated/account")({
  head: () => pageHead("My account", "Your SMOL STUUF orders, profile and coupons."),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: Account,
});
function Account() {
  const { data } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cancel = useServerFn(cancelOrder);
  const save = useServerFn(saveProfile);
  const run = async (action: Promise<unknown>) => { try { await action; await qc.invalidateQueries({ queryKey: ["customer-account"] }); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); } };
  return <><SiteHeader /><main className="customer-page">
    <div className="account-heading"><h1>My stuuf</h1><Button variant="outline" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }}>Sign out</Button></div>
    <form className="profile-form" onSubmit={e => { e.preventDefault(); void run(save({ data: { display_name: String(new FormData(e.currentTarget).get("name") ?? "") } })); }}>
      <label>Display name<input className="admin-input" name="name" defaultValue={data.profile.display_name} maxLength={100} /></label><Button type="submit">Save profile</Button>
    </form>
    <section><h2>Current orders</h2>{data.orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length === 0 && <p>No current orders.</p>}
      {data.orders.filter(o => !["delivered", "cancelled"].includes(o.status)).map(o => <article className="account-order" key={o.id}>
        <div><strong>Order {o.id.slice(0, 8)}</strong><span>{o.status} · {o.payment_status}</span></div>
        <p>{new Date(o.created_at).toLocaleDateString()} · {formatPrice(Number(o.total_amount))}{Number(o.discount_amount) > 0 && ` (coupon −${formatPrice(Number(o.discount_amount))})`}</p>
        <ul>{o.order_items.map(item => <li key={item.id}>{item.quantity} × {item.variation_name || `Product #${item.product_id}`} · {formatPrice(Number(item.unit_price))}</li>)}</ul>
        <p>{o.shipping_address}, {o.shipping_city}</p>
        {o.status === "pending" && o.payment_status !== "paid" && <Button variant="destructive" onClick={() => { if (confirm("Cancel this order?")) void run(cancel({ data: { id: o.id } })); }}>Cancel order</Button>}
      </article>)}
    </section>
    <section><h2>Order history</h2>{data.orders.filter(o => ["delivered", "cancelled"].includes(o.status)).map(o => <article className="account-order" key={o.id}><strong>Order {o.id.slice(0, 8)}</strong><p>{o.status} · {formatPrice(Number(o.total_amount))}</p></article>)}{!data.orders.some(o => ["delivered", "cancelled"].includes(o.status)) && <p>No past orders.</p>}</section>
    <section><h2>Coupons</h2>{!data.coupons.length && <p>No coupons assigned yet.</p>}{data.coupons.map(c => <article className="account-order" key={c.id}><strong>{c.code}</strong><p>{couponValueLabel(c, formatPrice)}{Number(c.min_order) > 0 && ` · min order ${formatPrice(Number(c.min_order))}`}{c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString()}`}</p><p>{c.description}</p><p>{c.used_at ? "Used" : c.expires_at && new Date(c.expires_at) < new Date() ? "Expired" : "Available"}</p><Button variant="outline" onClick={() => { void navigator.clipboard.writeText(c.code); toast.success("Copied"); }}>Copy code</Button></article>)}</section>
  </main><SiteFooter /></>;
}
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clipboard, Package, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { Button } from "@/components/ui/button";
import { getAccount, cancelOrder, saveProfile } from "@/lib/account.functions";
import { pageHead } from "@/lib/page-head";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/products";
import { useCustomer } from "@/hooks/use-customer";

const accountQuery = queryOptions({ queryKey: ["customer-account"], queryFn: () => getAccount() });
export const Route = createFileRoute("/_authenticated/account")({
  head: () => pageHead("My stuuf", "Your SMOL STUUF member profile and order history."),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: Account,
});
type Panel = "overview" | "orders";
function Account() {
  const { data } = useSuspenseQuery(accountQuery);
  const customer = useCustomer();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cancel = useServerFn(cancelOrder);
  const save = useServerFn(saveProfile);
  const [panel, setPanel] = useState<Panel>("overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(data.profile?.display_name ?? "");
  const deliveredCount = (data.orders ?? []).filter((o: any) => o.status === "delivered").length;
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast.success("Member ID copied"); }
    catch { toast.error("Couldn't copy. Please select and copy it manually."); }
  };
  const run = async (action: Promise<unknown>, message: string) => {
    try { await action; await qc.invalidateQueries({ queryKey: ["customer-account"] }); toast.success(message); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
  };
  if (!data.profile) return <><SiteHeader /><main className="customer-page smol-account"><div className="account-empty" role="alert"><UserRound size={28}/><strong>Your member profile could not be loaded.</strong><p>Please refresh the page or sign in again.</p><Button onClick={() => void navigate({ to: "/auth", replace: true })}>Sign in again</Button></div></main><SiteFooter /></>;
  const profile = data.profile;
  return <><SiteHeader /><main className="customer-page smol-account">
    <div className="account-hero"><div className="account-hero-copy"><span className="account-kicker">THE SMOL STUUF / MEMBER AREA</span><h1>MY STUUUF<span>®</span></h1><p>Your orders. Your details. Your little corner of stuuf.</p></div><div className="account-sticker" aria-hidden="true"><span>OFFICIAL</span><strong>SMOL<br/>MEMBER</strong></div></div>
    <div className="account-topline"><div className="account-id-ticket"><div className="account-id-icon"><UserRound size={25}/></div><div className="account-id-copy"><small>YOUR MEMBER ID</small><strong>{profile.id.slice(0,8).toUpperCase()}</strong><span>{customer?.email || profile.display_name || "SMOL STUUF MEMBER"}</span></div><button type="button" aria-label="Copy member ID" onClick={() => void copy(profile.id)}><Clipboard size={16}/></button></div><Button variant="outline" className="account-signout" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({to:"/auth",replace:true}); }}>Sign out ↗</Button></div>
    <div className="account-stats"><div className="account-stat stat-coral"><span>ORDERS DELIVERED</span><strong>{String(deliveredCount).padStart(2,"0")}</strong><Package size={21}/></div><div className="account-stat stat-yellow"><span>TOTAL ORDERS</span><strong>{String(data.orders?.length ?? 0).padStart(2,"0")}</strong><Package size={21}/></div></div>
    <nav className="account-tabs" aria-label="Account sections"><button type="button" className={panel==="overview"?"is-active":""} onClick={()=>setPanel("overview")}><UserRound size={16}/> PROFILE</button><button type="button" className={panel==="orders"?"is-active":""} onClick={()=>setPanel("orders")}><Package size={16}/> MY ORDERS</button></nav>
    {panel==="overview"&&<div className="account-content"><div className="account-welcome"><div><span className="account-kicker">HEY, {((profile.display_name || customer?.email?.split("@")[0] || "FRIEND").split(" ")[0] ?? "FRIEND").toUpperCase()}!</span><h2>Welcome to your<br/>little corner of stuuf.</h2><p>Keep track of your orders and manage your member details.</p><Button onClick={()=>setPanel("orders")}>View my orders ↗</Button></div><div className="welcome-doodle" aria-hidden="true"><span className="doodle-spark">✳</span><div className="doodle-face"><i/><i/><b/></div><span className="doodle-star">✦</span></div></div>
      <section className="account-profile-edit"><h2>Member profile</h2><label>Display name<input className="admin-input" value={displayName} maxLength={100} onChange={e=>setDisplayName(e.target.value)}/></label><Button onClick={()=>void run(save({data:{display_name:displayName}}),"Profile saved")}>Save profile</Button></section>
      <div className="account-section-title"><div><span>YOUR LATEST STUUUF</span><h2>Order check-in</h2></div><button type="button" onClick={()=>setPanel("orders")}>ALL ORDERS ↗</button></div>
      {(data.orders ?? []).slice(0,2).length ? (data.orders ?? []).slice(0,2).map((o:any)=><article className="account-order account-order-fun" key={o.id}><div><strong>ORDER #{o.id.slice(0,8).toUpperCase()}</strong><span className={"order-pill order-"+o.status}>{o.status.replaceAll("_"," ")}</span></div><p>{new Date(o.created_at).toLocaleDateString()} · {formatPrice(Number(o.total_amount))}</p><small>{o.order_items?.length ?? 0} line items</small></article>) : <p className="account-empty">No orders yet. Your first adventure is waiting.</p>}
    </div>}
    {panel==="orders"&&<div className="account-content"><div className="account-section-title"><div><span>YOUR PURCHASE HISTORY</span><h2>My orders</h2></div></div>{(data.orders ?? []).length ? (data.orders ?? []).map((o:any)=><article className="account-order account-order-fun" key={o.id}><div><strong>ORDER #{o.id.slice(0,8).toUpperCase()}</strong><span className={"order-pill order-"+o.status}>{o.status.replaceAll("_"," ")}</span></div><p>{new Date(o.created_at).toLocaleDateString()} · {formatPrice(Number(o.total_amount))}</p><small>{o.order_items?.length ?? 0} line items</small>{["pending","confirmed"].includes(o.status)&&<Button variant="outline" disabled={busy===o.id} onClick={()=>{setBusy(o.id);void run(cancel({data:{id:o.id}}),"Order cancellation requested").finally(()=>setBusy(null));}}>Cancel order</Button>}</article>) : <p className="account-empty">No orders yet.</p>}</div>}
  </main><SiteFooter/></>;
}

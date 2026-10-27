import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowUpRight, BadgeCheck, Clipboard, Crown, Gift, LockKeyhole, Package, Sparkles, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { Button } from "@/components/ui/button";
import { getAccount, getCardDex, cancelOrder, saveProfile, claimSetReward } from "@/lib/account.functions";
import { pageHead } from "@/lib/page-head";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/products";
import { useCustomer } from "@/hooks/use-customer";
import { CardArt } from "@/components/smol/CardArt";
import { setProgress, parseLayers, type CardDraft } from "@/lib/club";

const accountQuery = queryOptions({ queryKey: ["customer-account"], queryFn: () => getAccount() });
const cardDexQuery = queryOptions({ queryKey: ["customer-card-dex"], queryFn: () => getCardDex() });
export const Route = createFileRoute("/_authenticated/account")({
  head: () => pageHead("My stuuf", "Your SMOL STUUF ID, orders, collectible cards and achievements."),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(accountQuery), context.queryClient.ensureQueryData(cardDexQuery)]),
  component: Account,
});
type Panel = "overview" | "orders" | "cards" | "achievements";
function Account() {
  const { data } = useSuspenseQuery(accountQuery);
  const { data: dex } = useSuspenseQuery(cardDexQuery);
  const customer = useCustomer();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cancel = useServerFn(cancelOrder);
  const save = useServerFn(saveProfile);
  const claim = useServerFn(claimSetReward);
  const [panel, setPanel] = useState<Panel>("overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState(data.profile?.display_name ?? "");
  const owned = new Set((dex.cards ?? []).map((c: any) => c.card_id).filter(Boolean));
  const definitions = (dex.definitions ?? []) as any[];
  const visibleDefinitions = definitions.filter((c: any) => !c.is_secret && !c.is_archived);
  const cards = (dex.cards ?? []) as any[];
  const sets = (dex.sets ?? []) as any[];
  const achievements = (dex.achievements ?? []) as any[];
  const rewards = (dex.rewards ?? []) as any[];
  const deliveredCount = (data.orders ?? []).filter((o: any) => o.status === "delivered").length;
  const cardFor = (id: string) => definitions.find((c: any) => c.id === id);
  const cardProps = (definition: any) => ({
    title: definition.title,
    description: definition.description ?? "",
    design: (definition.design ?? "smile") as CardDraft["design"],
    rarity: (definition.rarity ?? "common") as CardDraft["rarity"],
    motion_enabled: definition.motion_enabled !== false,
    shadow_enabled: definition.shadow_enabled === true,
    border_enabled: definition.border_enabled !== false,
    layers: parseLayers(definition.layers),
  });
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast.success("Member ID copied"); }
    catch { toast.error("Couldn't copy. Please select and copy it manually."); }
  };
  const run = async (action: Promise<unknown>, message: string) => {
    try { await action; await qc.invalidateQueries({ queryKey: ["customer-account"] }); toast.success(message); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
  };
  const claimReward = async (setId: string) => {
    setBusy(setId);
    try {
      await claim({ data: { set: setId, fulfillment: fulfillment[setId] ?? "" } });
      await qc.invalidateQueries({ queryKey: ["customer-card-dex"] });
      toast.success("Set reward claimed! Your collection has been updated.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not claim reward"); }
    finally { setBusy(null); }
  };
  if (!data.profile) return <><SiteHeader /><main className="customer-page smol-account"><div className="account-empty" role="alert"><UserRound size={28}/><strong>Your member profile could not be loaded.</strong><p>Please refresh the page or sign in again.</p><Button onClick={() => void navigate({ to: "/auth", replace: true })}>Sign in again</Button></div></main><SiteFooter /></>;

  const profile = data.profile;
  return <><SiteHeader /><main className="customer-page smol-account">
    <div className="account-hero"><div className="account-hero-copy"><span className="account-kicker"><Sparkles size={14}/> THE SMOL CLUB / MEMBER AREA</span><h1>MY STUUUF<span>®</span></h1><p>Your orders. Your cards. Your little legends.</p></div><div className="account-sticker" aria-hidden="true"><span>OFFICIAL</span><strong>SMOL<br/>MEMBER</strong><Sparkles size={25}/></div></div>
    <div className="account-topline"><div className="account-id-ticket"><div className="account-id-icon"><UserRound size={25}/></div><div className="account-id-copy"><small>YOUR MEMBER ID</small><strong>{profile.id.slice(0,8).toUpperCase()}</strong><span>{customer?.email || profile.display_name || "SMOL CLUB MEMBER"}</span></div><button type="button" aria-label="Copy member ID" onClick={() => void copy(profile.id)}><Clipboard size={16}/></button></div><Button variant="outline" className="account-signout" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({to:"/auth",replace:true}); }}>Sign out ↗</Button></div>
    <div className="account-stats"><div className="account-stat stat-coral"><span>ORDERS DELIVERED</span><strong>{String(deliveredCount).padStart(2,"0")}</strong><Package size={21}/></div><div className="account-stat stat-yellow"><span>CARDS COLLECTED</span><strong>{String(owned.size).padStart(2,"0")}</strong><Sparkles size={21}/></div><div className="account-stat stat-blue"><span>SETS COMPLETED</span><strong>{String(sets.filter((s:any)=>setProgress(s,visibleDefinitions.filter((c:any)=>c.set_id===s.id),owned).complete).length).padStart(2,"0")}</strong><Crown size={21}/></div></div>
    <nav className="account-tabs" aria-label="Account sections">{([{id:"overview",label:"HOME BASE",icon:UserRound},{id:"orders",label:"MY ORDERS",icon:Package},{id:"cards",label:"CARD COLLECTION",icon:Sparkles},{id:"achievements",label:"ACHIEVEMENTS",icon:Crown}] as const).map(tab=><button key={tab.id} type="button" className={panel===tab.id?"is-active":""} onClick={()=>setPanel(tab.id)}><tab.icon size={16}/>{tab.label}{tab.id==="cards"&&<span>{owned.size}</span>}</button>)}</nav>
    {panel==="overview"&&<div className="account-content">
      <div className="account-welcome"><div><span className="account-kicker">HEY, {(profile.display_name || customer?.email?.split("@")[0] || "FRIEND").split(" ")[0].toUpperCase()}!</span><h2>Welcome to your<br/>little corner of stuuf.</h2><p>Build your collection, discover challenges, and unlock special set rewards.</p><Button onClick={()=>setPanel("cards")}>Open my collection <ArrowUpRight size={16}/></Button></div><div className="welcome-doodle" aria-hidden="true"><span className="doodle-spark">✳</span><div className="doodle-face"><i/><i/><b/></div><span className="doodle-star">✦</span></div></div>
      <div className="account-section-title"><div><span>01 / YOUR COLLECTION</span><h2>Sets in progress</h2></div><button type="button" onClick={()=>setPanel("cards")}>VIEW COLLECTION ↗</button></div>
      <div className="club-set-grid">{sets.filter((s:any)=>s.is_active).slice(0,3).map((s:any)=>{const p=setProgress(s,visibleDefinitions.filter((c:any)=>c.set_id===s.id),owned);return <article className="club-set-tile" key={s.id}><span>{p.complete?"SET COMPLETE":"COLLECTION SET"}</span><h3>{s.title}</h3><p>{s.description}</p><strong>{p.count}/{p.required} CARDS</strong><div className="club-progress"><i style={{width:`${Math.min(100,p.required?p.count/p.required*100:0)}%`}}/></div></article>})}</div>
      <div className="account-section-title"><div><span>02 / YOUR LATEST STUUUF</span><h2>Order check-in</h2></div><button type="button" onClick={()=>setPanel("orders")}>ALL ORDERS ↗</button></div>
      {(data.orders ?? []).slice(0,2).length ? (data.orders ?? []).slice(0,2).map((o:any)=><article className="account-order account-order-fun" key={o.id}><div><strong>ORDER #{o.id.slice(0,8).toUpperCase()}</strong><span className={"order-pill order-"+o.status}>{o.status.replaceAll("_"," ")}</span></div><p>{new Date(o.created_at).toLocaleDateString()} · {formatPrice(Number(o.total_amount))}</p><small>{o.order_items?.length ?? 0} line items</small></article>) : <p className="account-empty">No orders yet. Your first adventure is waiting.</p>}
      <section className="account-profile-edit"><h2>Member profile</h2><label>Display name<input className="admin-input" value={displayName} maxLength={100} onChange={e=>setDisplayName(e.target.value)}/></label><Button onClick={()=>void run(save({data:{display_name:displayName}}),"Profile saved")}>Save profile</Button></section>
    </div>}
    {panel==="orders"&&<div className="account-content"><div className="account-section-title"><div><span>YOUR PURCHASE HISTORY</span><h2>My orders</h2></div></div>{(data.orders ?? []).length ? (data.orders ?? []).map((o:any)=><article className="account-order account-order-fun" key={o.id}><div><strong>ORDER #{o.id.slice(0,8).toUpperCase()}</strong><span className={"order-pill order-"+o.status}>{o.status.replaceAll("_"," ")}</span></div><p>{new Date(o.created_at).toLocaleDateString()} · {formatPrice(Number(o.total_amount))}</p><small>{o.order_items?.length ?? 0} line items</small>{["pending","confirmed"].includes(o.status)&&<Button variant="outline" disabled={busy===o.id} onClick={()=>{setBusy(o.id);void run(cancel({data:{id:o.id}}),"Order cancellation requested").finally(()=>setBusy(null));}}>Cancel order</Button>}</article>) : <p className="account-empty">No orders yet.</p>}</div>}
    {panel==="cards"&&<div className="account-content"><div className="account-section-title"><div><span>YOUR PERMANENT COLLECTION</span><h2>Card library</h2><p>Cards you earn stay yours. Complete sets to unlock special gifts.</p></div></div>
      {sets.filter((s:any)=>s.is_active).map((s:any)=>{const setCards=visibleDefinitions.filter((c:any)=>c.set_id===s.id);const p=setProgress(s,setCards,owned);const reward=rewards.find((r:any)=>r.set_id===s.id);return <section className="club-set-section" key={s.id}><div className="club-set-heading"><div><span>{p.complete?"SET COMPLETE":"SET COLLECTION"}</span><h3>{s.title}</h3><p>{s.description}</p></div><strong>{p.count}/{p.required}</strong></div><div className="club-progress"><i style={{width:`${Math.min(100,p.required?p.count/p.required*100:0)}%`}}/></div><div className="club-card-grid">{setCards.map((d:any)=>{const has=owned.has(d.id);const card=cardFor(d.id);return <article key={d.id} className="club-owned-card">{card?<CardArt card={cardProps(card)} serial={cards.find((c:any)=>c.card_id===d.id)?.serial_number} locked={!has}/>:<div className="club-card-placeholder"><LockKeyhole/><strong>Undiscovered</strong></div>}<strong>{has?d.title:"Undiscovered card"}</strong><small>{has?d.rarity:"Complete an achievement to unlock"}</small></article>})}</div>{p.complete&&<div className="club-reward-panel"><Gift size={22}/><div><strong>{reward?"REWARD ALREADY CLAIMED":"SET COMPLETE — REWARD UNLOCKED"}</strong><p>{reward?reward.reward_title:`${s.reward_title || "Your special gift"} · ${s.reward_details || "Claim your reward from the club."}`}</p></div>{!reward&&s.claim_enabled&&<div className="club-reward-claim"><textarea className="admin-input" placeholder="Optional fulfillment notes (e.g. preferred pickup or next order)" maxLength={2000} value={fulfillment[s.id]??""} onChange={e=>setFulfillment(v=>({...v,[s.id]:e.target.value}))}/><Button disabled={busy===s.id} onClick={()=>void claimReward(s.id)}>{busy===s.id?"Claiming…":"Claim reward"}</Button></div>}</div>}</section>})}
      <section className="club-set-section"><h3>Unassigned cards</h3><div className="club-card-grid">{visibleDefinitions.filter((d:any)=>!d.set_id).map((d:any)=>{const has=owned.has(d.id);return <article className="club-owned-card" key={d.id}><CardArt card={cardProps(d)} locked={!has}/><strong>{has?d.title:"Undiscovered card"}</strong><small>{has?d.rarity:"Keep exploring"}</small></article>})}</div></section>
    </div>}
    {panel==="achievements"&&<div className="account-content"><div className="account-section-title"><div><span>YOUR NEXT DISCOVERIES</span><h2>Achievements</h2><p>Every challenge awards a permanent card to your collection.</p></div></div><div className="club-achievement-grid">{achievements.filter((a:any)=>!a.is_secret || a.state?.completed_at).map((a:any)=>{const done=Boolean(a.state?.completed_at);const card=cardFor(a.card_id);return <article className={"club-achievement "+(done?"is-complete":"")} key={a.id}><div className="club-achievement-icon">{done?<BadgeCheck/>:<LockKeyhole/>}</div><div><span>{done?"COMPLETED":a.category?.toUpperCase()||"CHALLENGE"}</span><h3>{a.title}</h3><p>{a.description}</p><div className="club-progress"><i style={{width:`${Math.min(100,Number(a.state?.progress??0)/Math.max(1,Number(a.requirement_value))*100)}%`}}/></div><small>{Math.min(Number(a.state?.progress??0),Number(a.requirement_value))}/{a.requirement_value} · {a.requirement_type?.replaceAll("_"," ")}</small>{card&&<p className="club-achievement-card">Card reward: <strong>{card.title}</strong></p>}</div></article>})}</div></div>}
  </main><SiteFooter/></>;
}

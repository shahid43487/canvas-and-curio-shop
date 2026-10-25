import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowUpRight, BadgeCheck, Check, Clipboard, Crown, Gift, LockKeyhole, Package, Sparkles, Ticket, UserRound, WandSparkles } from "lucide-react";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { Button } from "@/components/ui/button";
import { getAccount, getCardDex, cancelOrder, saveProfile, claimAchievementReward } from "@/lib/account.functions";
import { pageHead } from "@/lib/page-head";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/products";
import { couponArtText, couponDesign, couponStatus, couponValueLabel, type CouponStatus } from "@/lib/coupon";
import { CouponArt } from "@/components/smol/CouponArt";
import { useCustomer } from "@/hooks/use-customer";

const accountQuery = queryOptions({ queryKey: ["customer-account"], queryFn: () => getAccount() });
const cardDexQuery = queryOptions({ queryKey: ["customer-card-dex"], queryFn: () => getCardDex() });
export const Route = createFileRoute("/_authenticated/account")({
  head: () => pageHead("My stuuf", "Your SMOL STUUF ID, orders, collectible coupon cards and achievements."),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(accountQuery), context.queryClient.ensureQueryData(cardDexQuery)]),
  component: Account,
});

type Panel = "overview" | "orders" | "cards" | "achievements";
type DexCard = { id: string; card_type: "coupon" | "achievement" | "special" | string; source_id: string; serial_number: string; rarity: string; acquired_at: string; metadata: unknown };
const achievements = [
  { id: "first-drop" as const, title: "FIRST DROP", subtitle: "Welcome to the club", orders: 1, reward: "10% off", detail: "Get your first order delivered.", card: "FIRST DROP" },
  { id: "collector-three" as const, title: "COLLECTOR", subtitle: "Three's a collection", orders: 3, reward: "15% off", detail: "Have 3 orders delivered.", card: "SERIOUS STUUF" },
  { id: "inner-circle-five" as const, title: "INNER CIRCLE", subtitle: "Certified smol legend", orders: 5, reward: "20% off", detail: "Have 5 orders delivered.", card: "INNER CIRCLE" },
  { id: "repeat-legend" as const, title: "REPEAT LEGEND", subtitle: "A true regular", orders: 10, reward: "25% off", detail: "Have 10 orders delivered.", card: "REPEAT LEGEND" },
  { id: "secret-stuuf" as const, title: "THE SECRET STUUF", subtitle: "A hidden club milestone", orders: 15, reward: "30% off", detail: "Have 15 orders delivered.", card: "SECRET STUUF" },
];

function Account() {
  const { data } = useSuspenseQuery(accountQuery);
  const { data: dex } = useSuspenseQuery(cardDexQuery);
  const dexCards = (dex.cards ?? []) as DexCard[];
  const customer = useCustomer();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cancel = useServerFn(cancelOrder);
  const save = useServerFn(saveProfile);
  const claim = useServerFn(claimAchievementReward);
  const [panel, setPanel] = useState<Panel>("overview");
  const [claiming, setClaiming] = useState<string | null>(null);
  const deliveredCount = data.orders.filter(o => o.status === "delivered").length;
  const activeCount = data.coupons.filter(c => couponStatus(c) === "active").length;
  const usedCount = data.coupons.filter(c => couponStatus(c) === "used").length;
  const earnedAchievementCards = achievements.filter(a => deliveredCount >= a.orders);
  const run = async (action: Promise<unknown>) => { try { await action; await qc.invalidateQueries({ queryKey: ["customer-account"] }); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); } };
  const copy = async (value: string, message = "Copied") => { try { await navigator.clipboard.writeText(value); toast.success(message); } catch { toast.error("Couldn't copy. Please select and copy it manually."); } };
  const claimReward = async (achievement: typeof achievements[number]) => {
    setClaiming(achievement.id);
    try {
      const result = await claim({ data: { achievement: achievement.id } });
      await Promise.all([qc.invalidateQueries({ queryKey: ["customer-account"] }), qc.invalidateQueries({ queryKey: ["customer-card-dex"] })]);
      toast.success(result.alreadyClaimed ? "That reward is already in your card library." : "Reward unlocked! Your new coupon card is in your library.");
      setPanel("cards");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not claim reward"); }
    finally { setClaiming(null); }
  };
  const statusLabel = (status: CouponStatus) => status === "active" ? "READY TO USE" : status === "used" ? "COLLECTED · USED" : "EXPIRED · STILL YOURS";
  if (!data.profile) return <><SiteHeader /><main className="customer-page smol-account"><div className="account-empty" role="alert"><UserRound size={28}/><strong>Your member profile could not be loaded.</strong><p>Please refresh the page or sign in again.</p><Button onClick={() => void navigate({ to: "/auth", replace: true })}>Sign in again</Button></div></main><SiteFooter /></>;

  return <><SiteHeader /><main className="customer-page smol-account">
    <div className="account-hero">
      <div className="account-hero-copy"><span className="account-kicker"><Sparkles size={14} /> THE SMOL CLUB / MEMBER AREA</span><h1>MY STUUUF<span>®</span></h1><p>Your orders. Your cards. Your little legends.</p></div>
      <div className="account-sticker" aria-hidden="true"><span>OFFICIAL</span><strong>SMOL<br/>MEMBER</strong><Sparkles size={25}/></div>
    </div>
    <div className="account-topline">
      <div className="account-id-ticket"><div className="account-id-icon"><UserRound size={25}/></div><div className="account-id-copy"><small>YOUR MEMBER ID</small><strong>{data.profile.id.slice(0, 8).toUpperCase()}</strong><span>{customer?.email || data.profile.display_name || "SMOL CLUB MEMBER"}</span></div><button type="button" aria-label="Copy member ID" onClick={() => void copy(data.profile.id, "Member ID copied")}><Clipboard size={16}/></button></div>
      <Button variant="outline" className="account-signout" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }}>Sign out ↗</Button>
    </div>
    <div className="account-stats">
      <div className="account-stat stat-coral"><span>ORDERS DELIVERED</span><strong>{deliveredCount.toString().padStart(2, "0")}</strong><Package size={21}/></div>
      <div className="account-stat stat-yellow"><span>CARDS COLLECTED</span><strong>{(data.coupons.length + earnedAchievementCards.length).toString().padStart(2, "0")}</strong><Ticket size={21}/></div>
      <div className="account-stat stat-blue"><span>READY TO USE</span><strong>{activeCount.toString().padStart(2, "0")}</strong><Gift size={21}/></div>
    </div>
    <nav className="account-tabs" aria-label="Account sections">
      {([{id:"overview",label:"HOME BASE",icon:UserRound},{id:"orders",label:"MY ORDERS",icon:Package},{id:"cards",label:"CARD LIBRARY",icon:Ticket},{id:"achievements",label:"ACHIEVEMENTS",icon:Crown}] as const).map(tab => <button key={tab.id} type="button" className={panel === tab.id ? "is-active" : ""} onClick={() => setPanel(tab.id)}><tab.icon size={16}/>{tab.label}{tab.id === "cards" && <span>{data.coupons.length + earnedAchievementCards.length}</span>}</button>)}
    </nav>

    {panel === "overview" && <div className="account-content">
      <div className="account-welcome"><div><span className="account-kicker">HEY, {((data.profile?.display_name || customer?.email?.split("@")[0] || "FRIEND").split(" ")[0] ?? "").charAt(0).toUpperCase()}!</span><h2>Welcome to your<br/>little corner of stuuf.</h2><p>Keep an eye on your orders, collect coupon cards, and earn more by completing club challenges.</p><Button onClick={() => setPanel("cards")}>Open my card library <ArrowUpRight size={16}/></Button></div><div className="welcome-doodle" aria-hidden="true"><span className="doodle-spark">✳</span><div className="doodle-face"><i/><i/><b/></div><span className="doodle-star">✦</span></div></div>
      <div className="account-section-title"><div><span>01 / YOUR LATEST STUUUF</span><h2>Order check-in</h2></div><button type="button" onClick={() => setPanel("orders")}>ALL ORDERS ↗</button></div>
      {data.orders.slice(0, 2).length ? data.orders.slice(0, 2).map(o => <article className="account-order account-order-fun" key={o.id}><div><strong>ORDER #{o.id.slice(0, 8).toUpperCase()}</strong><span className={"order-pill order-" + o.status}>{o.status.replaceAll("_", " ")}</span></div><p>{new Date(o.created_at).toLocaleDateString()} · {formatPrice(Number(o.total_amount))}</p><small>{o.order_items.length} line item{o.order_items.length === 1 ? "" : "s"} · {o.payment_status}</small></article>) : <div className="account-empty"><Package size={28}/><strong>No orders yet. Your adventure awaits.</strong><a href="/shop">GO FIND SOME STUUUF ↗</a></div>}
      <div className="account-section-title"><div><span>02 / YOUR NEXT UNLOCK</span><h2>Achievement board</h2></div><button type="button" onClick={() => setPanel("achievements")}>SEE CHALLENGES ↗</button></div>
      <div className="achievement-mini-grid">{achievements.map(a => <div key={a.id} className={"achievement-mini " + (deliveredCount >= a.orders ? "is-earned" : "")}><span>{deliveredCount >= a.orders ? <BadgeCheck size={19}/> : <LockKeyhole size={18}/>}</span><strong>{a.title}</strong><small>{Math.min(deliveredCount, a.orders)} / {a.orders} delivered</small></div>)}</div>
    </div>}

    {panel === "orders" && <div className="account-content"><div className="account-section-title"><div><span>TRACK IT / KEEP RECEIPTS</span><h2>My orders</h2></div><span className="account-count">{data.orders.length} TOTAL</span></div>
      {!data.orders.length && <div className="account-empty"><Package size={28}/><strong>No orders on file yet.</strong><a href="/shop">START YOUR COLLECTION ↗</a></div>}
      {data.orders.map(o => <article className="account-order account-order-fun" key={o.id}><div><strong>ORDER #{o.id.slice(0, 8).toUpperCase()}</strong><span className={"order-pill order-" + o.status}>{o.status.replaceAll("_", " ")}</span></div><p>{new Date(o.created_at).toLocaleDateString()} · {formatPrice(Number(o.total_amount))}{Number(o.discount_amount) > 0 && " · coupon saved " + formatPrice(Number(o.discount_amount))}</p><ul>{o.order_items.map(item => <li key={item.id}>{item.quantity} × {item.variation_name || `Product #${item.product_id}`} · {formatPrice(Number(item.unit_price))}</li>)}</ul><p>{o.shipping_address}, {o.shipping_city}</p><small>Payment: {o.payment_status} · {o.payment_method}</small>{o.status === "pending" && o.payment_status !== "paid" && <div className="account-order-actions"><Button variant="destructive" onClick={() => { if (confirm("Cancel this order?")) void run(cancel({ data: { id: o.id } })); }}>Cancel order</Button></div>}</article>)}
    </div>}

    {panel === "cards" && <div className="account-content"><div className="account-section-title"><div><span>YOUR PERSONAL DECK / KEEP FOREVER</span><h2>Card library</h2><p>Every coupon is a collectible. Use one at checkout and it stays here as part of your story. Achievement cards join your deck as you level up.</p></div><span className="account-count">{data.coupons.length + earnedAchievementCards.length} CARDS</span></div>
      <div className="achievement-collection"><div className="account-section-title"><div><span>BADGES / EARNED IN THE REAL WORLD</span><h2>Achievement cards</h2></div><span className="account-count">{earnedAchievementCards.length} UNLOCKED</span></div><div className="achievement-collection-grid">{achievements.map((a, index) => { const earned = deliveredCount >= a.orders; const ownedCard = dexCards.find((card: DexCard) => card.card_type === "achievement" && card.source_id === a.id); const secretHidden = a.id === "secret-stuuf" && !ownedCard; return <article key={a.id} className={"achievement-collect-card " + (ownedCard ? "is-collected" : "is-locked")}><div className={"achievement-collect-art achievement-art-" + (index % 3)}><span>SMOL CLUB · {ownedCard?.serial_number || (secretHidden ? "CLASSIFIED" : `LOCKED 0${index + 1}`)}</span><strong>{secretHidden ? "???" : a.card}</strong><small>{secretHidden ? "MYSTERY REWARD" : `${a.reward} REWARD`}</small><Sparkles size={19}/></div><div className="achievement-collect-meta"><strong>{secretHidden ? "HIDDEN CARD" : a.title}</strong><span>{ownedCard ? `OWNED · ${ownedCard.rarity.toUpperCase()}` : secretHidden ? "SECRET · KEEP EXPLORING" : `LOCKED · ${Math.min(deliveredCount, a.orders)}/${a.orders} ORDERS`}</span></div></article>; })}</div></div>
      <div className="card-library-filters"><span><i className="filter-dot dot-active"/> {activeCount} READY</span><span><i className="filter-dot dot-used"/> {usedCount} USED</span><span><i className="filter-dot dot-expired"/> {data.coupons.filter(c => couponStatus(c) === "expired").length} EXPIRED</span></div>
      {!data.coupons.length && !earnedAchievementCards.length && <div className="account-empty"><Ticket size={30}/><strong>Your card collection is waiting for its first card.</strong><p>Complete an achievement or keep an eye out for a coupon from the SMOL crew.</p><Button onClick={() => setPanel("achievements")}>Find cards to earn <Sparkles size={16}/></Button></div>}
      <div className="coupon-collection-grid">{data.coupons.map(c => { const status = couponStatus(c); const art = couponArtText(c, formatPrice); return <article className={"coupon-collectible coupon-" + status} key={c.id}><div className="coupon-art-wrap"><CouponArt design={couponDesign(c)} lines={art.lines} note={art.note} code={c.code} valid={c.expires_at} /></div><div className="coupon-collectible-info"><div className="coupon-collectible-status"><span className={"coupon-status-dot dot-" + status}/>{statusLabel(status)}</div><div className="coupon-card-meta-row"><span>{dexCards.find((card: DexCard) => card.card_type === "coupon" && card.source_id === c.id)?.serial_number || "COLLECTIBLE"}</span><span className={"rarity rarity-" + (dexCards.find((card: DexCard) => card.card_type === "coupon" && card.source_id === c.id)?.rarity || "common")}>{(dexCards.find((card: DexCard) => card.card_type === "coupon" && card.source_id === c.id)?.rarity || "common").toUpperCase()}</span></div><h3>{c.code}</h3><p>{couponValueLabel(c, formatPrice)}</p>{c.description && <small>{c.description}</small>}{Number(c.min_order) > 0 && <small>MIN. ORDER {formatPrice(Number(c.min_order))}</small>}{c.expires_at && <small>{status === "used" ? "EXPIRED" : "VALID UNTIL"} {new Date(c.expires_at).toLocaleDateString()}</small>}{c.used_at && <small>USED ON {new Date(c.used_at).toLocaleDateString()}</small>}<div className="coupon-card-actions">{status === "active" && <Button onClick={() => void copy(c.code, "Coupon code copied — ready for checkout")}>Copy code <Clipboard size={14}/></Button>}<span>{status === "used" ? "A GOOD RUN 🫡" : status === "expired" ? "ARCHIVED IN YOUR DECK" : "READY WHEN YOU ARE"}</span></div></div></article>; })}</div>
    </div>}

    {panel === "achievements" && <div className="account-content"><div className="account-section-title"><div><span>CHALLENGES / EARN YOUR STUUUF</span><h2>Achievement library</h2><p>Real orders, real milestones, real rewards. Delivered orders count toward your next unlock.</p></div><span className="account-count">{achievements.filter(a => deliveredCount >= a.orders).length} / {achievements.length} UNLOCKED</span></div>
      <div className="achievement-library-grid">{achievements.map((a, index) => { const secretHidden = a.id === "secret-stuuf" && deliveredCount < a.orders; const earned = deliveredCount >= a.orders; const suffix = data.profile.id.replace(/-/g, "").slice(0, 8).toUpperCase(); const claimed = data.coupons.some(c => c.code === `SMOL-${a.id.toUpperCase().replace(/-/g, "").slice(0, 12)}-${suffix}` || c.code === `SMOL-${({ "first-drop":"FIRSTDROP", "collector-three":"COLLECTOR", "inner-circle-five":"INNER5", "repeat-legend":"REPEAT10", "secret-stuuf":"SECRET15" } as const)[a.id]}-${suffix}`); const progress = Math.min(100, Math.round(deliveredCount / a.orders * 100)); return <article key={a.id} className={"achievement-card " + (earned ? "achievement-unlocked" : "achievement-locked")}><div className={"achievement-art achievement-art-" + index}><span className="achievement-number">0{index + 1}</span>{earned ? <BadgeCheck size={42}/> : <LockKeyhole size={36}/>}<Sparkles className="achievement-spark" size={20}/></div><div className="achievement-card-body"><span className="account-kicker">{earned ? "CHALLENGE COMPLETE" : "NEXT MISSION"}</span><h3>{secretHidden ? "???" : a.title}</h3><p>{secretHidden ? "A hidden challenge is waiting to be discovered." : a.detail}</p><div className="achievement-progress"><span style={{width: progress + "%"}}/></div><small>{secretHidden ? "SECRET MILESTONE · KEEP EXPLORING" : `${Math.min(deliveredCount, a.orders)} OF ${a.orders} DELIVERED ORDERS`}</small><div className="achievement-reward"><Gift size={16}/><strong>{secretHidden ? "MYSTERY REWARD" : `${a.reward} COUPON`}</strong><span>+ COLLECTIBLE CARD</span></div>{claimed ? <div className="achievement-claimed"><Check size={16}/> REWARD IN YOUR CARD LIBRARY</div> : earned ? <Button disabled={claiming !== null} onClick={() => void claimReward(a)}>{claiming === a.id ? "UNLOCKING..." : "CLAIM MY REWARD"} <WandSparkles size={15}/></Button> : <div className="achievement-locked-note"><LockKeyhole size={14}/> KEEP GOING, YOU'RE GETTING THERE</div>}</div></article>; })}</div>
    </div>}

    <section className="account-profile-panel"><div><span className="account-kicker">YOUR DETAILS / KEEP IT CURRENT</span><h2>Member settings</h2><p>Update the name shown around your SMOL account.</p></div><form className="profile-form" onSubmit={e => { e.preventDefault(); void run(save({ data: { display_name: String(new FormData(e.currentTarget).get("name") ?? "") } })); }}><label>Display name<input className="admin-input" name="name" defaultValue={data.profile.display_name} maxLength={100} placeholder="Your club name"/></label><Button type="submit">Save profile <Check size={15}/></Button></form></section>
    <p className="account-footnote">MADE OF SMALL THINGS & BIG PERSONALITY. <span>SMOL STUUF CLUB ©</span></p>
  </main><SiteFooter /></>;
}

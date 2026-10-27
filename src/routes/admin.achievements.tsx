import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Eye, EyeOff, Plus, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardArt } from "@/components/smol/CardArt";
import { adminClub, adminSaveAchievement } from "@/lib/club-admin.functions";
import { useAdminToken } from "@/lib/admin-session";
import { type AchievementDraft, type CardDraft } from "@/lib/club";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/admin/achievements")({
  head: () => pageHead("Achievement Lab", "Manage SMOL CLUB challenges and permanent collectible card rewards."),
  component: AchievementLab,
});
const blank = (): AchievementDraft => ({ id: "", title: "", description: "", category: "discovery", requirement_type: "collected_cards", requirement_value: 1, card_id: "", target_set_id: null, rarity: "common", is_secret: false, is_active: true, sort_order: 0 });
function AchievementLab() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const save = useServerFn(adminSaveAchievement);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-club", token], enabled: Boolean(token), retry: false, queryFn: () => adminClub({ data: { token } }) });
  const [draft, setDraft] = useState<AchievementDraft>(blank());
  const [busy, setBusy] = useState(false);
  const patch = (values: Partial<AchievementDraft>) => setDraft(current => ({ ...current, ...values }));
  const cards = data?.cards ?? [];
  const selectedCard = cards.find((card: any) => card.id === draft.card_id);
  const preview = selectedCard ? <CardArt card={{ title: selectedCard.title, description: selectedCard.description ?? "", design: selectedCard.design as CardDraft["design"], rarity: draft.rarity, motion_enabled: selectedCard.motion_enabled !== false, shadow_enabled: selectedCard.shadow_enabled === true, border_enabled: selectedCard.border_enabled !== false, layers: selectedCard.layers }} /> : null;
  const load = (row: any) => setDraft({ ...row, card_id: row.card_id ?? "", rarity: row.rarity as AchievementDraft["rarity"], requirement_type: row.requirement_type as AchievementDraft["requirement_type"] });
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true);
    try { await save({ data: { token, achievement: draft } }); await qc.invalidateQueries({ queryKey: ["admin-club"] }); toast.success("Achievement saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save achievement"); }
    finally { setBusy(false); }
  };
  return <main className="admin-page achievement-admin club-admin">
    <div className="admin-row"><div><h1 className="admin-h1" style={{ marginBottom: 0 }}>Achievement Lab <Sparkles size={22} style={{ display: "inline", verticalAlign: "middle" }} /></h1><small>Design challenges that unlock permanent cards—not discounts.</small></div><span className="admin-count">{data?.achievements.length ?? 0} CHALLENGES</span></div>
    <div className="achievement-admin-intro"><BadgeCheck size={24}/><div><strong>Every achievement awards a lasting collectible.</strong><p>Choose the condition, card, rarity and visibility. Completion is verified server-side, and cards already earned remain in the collection.</p></div></div>
    {error && <p role="alert">Could not load achievement definitions. Check your admin session and confirm the SMOL CLUB migration is applied.</p>}
    {isLoading && <p>Loading challenges…</p>}
    <div className="club-design-tray">{(data?.achievements ?? []).map((row: any) => <Button key={row.id} type="button" variant={draft.id === row.id ? "default" : "outline"} onClick={() => load(row)}>{row.title}</Button>)}<Button type="button" onClick={() => setDraft(blank())}><Plus size={15}/> New achievement</Button></div>
    <div className="club-editor achievement-editor">
      <form className="admin-form achievement-admin-fields" onSubmit={submit}>
        <label>Internal ID<input className="admin-input" required pattern="[a-z0-9-]{2,80}" value={draft.id} onChange={e => patch({ id: e.target.value })} disabled={Boolean(data?.achievements.some((a: any) => a.id === draft.id)} /></label>
        <label>Display title<input className="admin-input" required maxLength={80} value={draft.title} onChange={e => patch({ title: e.target.value })}/></label>
        <label>Description<textarea className="admin-input" rows={3} maxLength={300} value={draft.description} onChange={e => patch({ description: e.target.value })}/></label>
        <div className="achievement-admin-two"><label>Category<input className="admin-input" maxLength={60} value={draft.category} onChange={e => patch({ category: e.target.value })}/></label><label>Rarity<select className="admin-input" value={draft.rarity} onChange={e => patch({ rarity: e.target.value as AchievementDraft["rarity"] })}>{["common","uncommon","rare","epic","legendary"].map(v => <option key={v}>{v}</option>)}</select></label></div>
        <div className="achievement-admin-two"><label>Requirement<select className="admin-input" value={draft.requirement_type} onChange={e => patch({ requirement_type: e.target.value as AchievementDraft["requirement_type"] })}><option value="collected_cards">Collect cards</option><option value="delivered_orders">Delivered orders</option><option value="delivered_spend">Delivered spend (TK)</option></select></label><label>Target value<input className="admin-input" type="number" min={1} max={1000000} value={draft.requirement_value} onChange={e => patch({ requirement_value: Number(e.target.value) })}/></label></div>
        <label>Card awarded<select className="admin-input" required value={draft.card_id} onChange={e => { const c = cards.find((card: any) => card.id === e.target.value); patch({ card_id: e.target.value, target_set_id: c?.set_id ?? null }); }}><option value="">Choose a card…</option>{cards.filter((c: any) => c.is_active && !c.is_archived).map((c: any) => <option key={c.id} value={c.id}>{c.title}{c.set_id ? "" : " · Unassigned"}</option>)}</select></label>
        <label>Card set<select className="admin-input" value={draft.target_set_id ?? ""} onChange={e => patch({ target_set_id: e.target.value || null })}><option value="">Independent card</option>{(data?.sets ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
        <label>Sort order<input className="admin-input" type="number" value={draft.sort_order} onChange={e => patch({ sort_order: Number(e.target.value) })}/></label>
        <label className="achievement-admin-toggle"><input type="checkbox" checked={draft.is_secret} onChange={e => patch({ is_secret: e.target.checked })}/>{draft.is_secret ? <EyeOff size={15}/> : <Eye size={15}/>} Hidden until earned</label>
        <label className="achievement-admin-toggle"><input type="checkbox" checked={draft.is_active} onChange={e => patch({ is_active: e.target.checked })}/>{draft.is_active ? "Active and trackable" : "Paused"}</label>
        <Button type="submit" disabled={busy}><Save size={15}/>{busy ? "Saving…" : "Save achievement"}</Button>
      </form>
      <aside className="club-live-preview"><span>LIVE CARD PREVIEW</span>{preview ?? <div className="club-card-placeholder"><Sparkles/><strong>Choose a reward card</strong></div>}<h2>{draft.title || "New achievement"}</h2><p>{draft.description || "Your challenge description appears here."}</p><small>{draft.requirement_value} · {draft.requirement_type.replaceAll("_", " ")}</small></aside>
    </div>
  </main>;
}

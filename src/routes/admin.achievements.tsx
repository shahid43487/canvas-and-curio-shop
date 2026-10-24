import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Eye, EyeOff, Save, Sparkles } from "lucide-react";
import { pageHead } from "@/lib/page-head";
import { useAdminToken } from "@/lib/admin-session";
import { adminListAchievements, adminSaveAchievement } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/achievements")({
  head: () => pageHead("Achievement Lab", "Manage SMOL CLUB achievements, rarity and collectible rewards."),
  component: AchievementLab,
});

type Achievement = {
  id: string; title: string; description: string; requirement_value: number;
  reward_discount_value: number; rarity: string; is_secret: boolean; is_active: boolean; sort_order: number;
};

function AchievementLab() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "achievements", token], enabled: Boolean(token), retry: false,
    queryFn: () => adminListAchievements({ data: { token } }),
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<Achievement>>>({});
  const rows = (data?.achievements ?? []) as Achievement[];
  const patch = (row: Achievement, values: Partial<Achievement>) => setDrafts(current => ({ ...current, [row.id]: { ...current[row.id], ...values } }));
  const save = async (row: Achievement) => {
    const d = { ...row, ...drafts[row.id] };
    setBusy(row.id);
    try {
      await adminSaveAchievement({ data: {
        token, id: d.id, title: d.title, description: d.description,
        requirement_value: Number(d.requirement_value), reward_discount_value: Number(d.reward_discount_value),
        rarity: d.rarity, is_secret: Boolean(d.is_secret), is_active: Boolean(d.is_active), sort_order: Number(d.sort_order),
      }});
      toast.success("Achievement saved. New settings apply to future progress checks.");
      setDrafts(current => { const next = { ...current }; delete next[row.id]; return next; });
      await qc.invalidateQueries({ queryKey: ["admin", "achievements"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save achievement"); }
    finally { setBusy(null); }
  };
  return <main className="admin-page achievement-admin">
    <div className="admin-row"><div><h1 className="admin-h1" style={{marginBottom:0}}>Achievement Lab <Sparkles size={22} style={{display:"inline",verticalAlign:"middle"}}/></h1><small>Build the challenges that make SMOL CLUB worth collecting.</small></div><span className="admin-count">{rows.length} DEFINITIONS</span></div>
    <div className="achievement-admin-intro"><BadgeCheck size={24}/><div><strong>Every achievement is a collectible.</strong><p>Choose the order milestone, coupon reward, rarity and whether a challenge is hidden. Progress and card ownership are recorded server-side. Existing earned cards are never taken away when you edit a challenge.</p></div></div>
    {isLoading && <p>Loading achievement definitions…</p>}
    {error && <p role="alert">Could not load achievements. Check your admin session and confirm the collectible migration has been applied.</p>}
    <div className="achievement-admin-grid">{rows.map(row => { const d = { ...row, ...drafts[row.id] }; return <section className="achievement-admin-card" key={row.id}>
      <div className={"achievement-admin-banner rarity-bg-" + d.rarity}><span>SMOL CLUB / ACHIEVEMENT</span><strong>{d.title || "UNTITLED"}</strong><small>{d.rarity.toUpperCase()} EDITION</small></div>
      <div className="achievement-admin-fields">
        <label>Internal ID<input className="admin-input" value={d.id} disabled /></label>
        <label>Card title<input className="admin-input" value={d.title} maxLength={80} onChange={e => patch(row,{title:e.target.value})}/></label>
        <label>Description<textarea className="admin-input" rows={2} value={d.description} maxLength={300} onChange={e => patch(row,{description:e.target.value})}/></label>
        <div className="achievement-admin-two"><label>Delivered orders<input className="admin-input" type="number" min={1} max={10000} value={d.requirement_value} onChange={e => patch(row,{requirement_value:Number(e.target.value)})}/></label><label>Coupon reward (%)<input className="admin-input" type="number" min={0} max={100} value={d.reward_discount_value} onChange={e => patch(row,{reward_discount_value:Number(e.target.value)})}/></label></div>
        <label>Rarity<select className="admin-input" value={d.rarity} onChange={e => patch(row,{rarity:e.target.value})}>{["common","uncommon","rare","epic","legendary"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label className="achievement-admin-toggle"><input type="checkbox" checked={d.is_secret} onChange={e => patch(row,{is_secret:e.target.checked})}/>{d.is_secret ? <EyeOff size={15}/> : <Eye size={15}/>} Secret achievement</label>
        <label className="achievement-admin-toggle"><input type="checkbox" checked={d.is_active} onChange={e => patch(row,{is_active:e.target.checked})}/>{d.is_active ? "Active and trackable" : "Paused"}</label>
        <button className="admin-btn" type="button" disabled={busy !== null} onClick={() => void save(row)}><Save size={15}/>{busy === row.id ? "Saving…" : "Save achievement"}</button>
      </div>
    </section>; })}</div>
  </main>;
}

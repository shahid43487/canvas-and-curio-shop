import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PRESETS, STICKERS, slideStatus, type Preset, type Slide } from "@/data/drops";
import { adminSaveSetting } from "@/lib/admin.functions";
import { useSite } from "@/lib/site";
import { SlideBody } from "@/components/smol/DropsHero";
import { AdminUpload } from "@/components/smol/AdminUpload";
import { useAdminToken } from "@/lib/admin-session";

export const Route = createFileRoute("/admin/campaigns")({ component: Campaigns });

const blank = (): Slide => ({ id: `slide-${Date.now().toString(36)}`, eyebrow: "NEW DROP", title: "NEW THING.", accent: "BIG MOOD.", sub: "Say something smol and weird.", cta: { label: "Shop the drop", to: "/shop" }, sticker: "drop", preset: "split" });

function Campaigns() {
  const token = useAdminToken();
  const site = useSite();
  const qc = useQueryClient();
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [sel, setSel] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [interval, setIntervalSeconds] = useState<number | null>(null);
  useEffect(() => { if (site && !slides) setSlides(site.slides); }, [site, slides]);
  if (!slides || !site) return <p>Loading…</p>;

  const change = (next: Slide[]) => { setSlides(next); setDirty(true); };
  const patch = (p: Partial<Slide>) => change(slides.map((s, n) => (n === sel ? { ...s, ...p } : s)));
  const move = (d: number) => { const j = sel + d; if (j < 0 || j >= slides.length) return; const c = [...slides]; [c[sel], c[j]] = [c[j]!, c[sel]!]; change(c); setSel(j); };
  const save = async () => {
    try { await Promise.all([adminSaveSetting({ data: { token, key: "slides", value: slides } }), adminSaveSetting({ data: { token, key: "slideInterval", value: interval ?? site.slideInterval } })]); toast.success("Published to homepage"); setDirty(false); qc.invalidateQueries({ queryKey: ["site-settings"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const s = slides[sel];
  const stickers = [...STICKERS, ...site.stickers.custom].filter((x) => !site.stickers.hidden.includes(x.id));

  return (
    <>
      <div className="admin-row"><h1 className="admin-h1">Hero slides</h1>
        <button className="admin-btn" onClick={() => { change([...slides, blank()]); setSel(slides.length); }}>+ Add slide</button>
        <button className="admin-btn" disabled={!dirty} onClick={save}>{dirty ? "Publish changes" : "All saved"}</button></div>
      <label className="admin-row">Slide duration · {interval ?? site.slideInterval}s <input aria-label="Slide duration" type="range" min={2} max={15} step={1} value={interval ?? site.slideInterval} onChange={e => { setIntervalSeconds(Number(e.target.value)); setDirty(true); }} /></label>
      <table className="admin-table"><tbody>
        {slides.map((x, n) => (
          <tr key={x.id} style={{ background: n === sel ? "#fff6c2" : undefined, cursor: "pointer" }} onClick={() => setSel(n)}>
            <td>{n + 1}</td><td><b>{x.title} {x.accent}</b></td>
            <td><span className={`admin-badge ${x.hidden ? "ended" : slideStatus(x)}`}>{x.hidden ? "hidden" : slideStatus(x)}</span></td>
          </tr>
        ))}
      </tbody></table>
      {!slides.length && <p className="admin-panel">No slides — the homepage shows the default one. Add a slide.</p>}
      {s && (
        <section className="admin-panel" style={{ marginTop: "1rem" }}>
          <div className="admin-row">
            <button className="admin-btn ghost" onClick={() => move(-1)}>↑ Up</button>
            <button className="admin-btn ghost" onClick={() => move(1)}>↓ Down</button>
            <button className="admin-btn ghost" onClick={() => { change([...slides.slice(0, sel + 1), { ...s, id: blank().id }, ...slides.slice(sel + 1)]); setSel(sel + 1); }}>Duplicate</button>
            <button className="admin-btn ghost" onClick={() => patch({ hidden: !s.hidden })}>{s.hidden ? "Show" : "Hide"}</button>
            <button className="admin-btn danger" onClick={() => { if (confirm("Delete this slide?")) { change(slides.filter((_, n) => n !== sel)); setSel(Math.max(0, sel - 1)); } }}>Delete</button>
          </div>
          <div className="admin-form">
            <label>Small top line<input className="admin-input" value={s.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} /></label>
            <label>Headline<input className="admin-input" value={s.title} onChange={(e) => patch({ title: e.target.value })} /></label>
            <label>Red headline<input className="admin-input" value={s.accent} onChange={(e) => patch({ accent: e.target.value })} /></label>
            <label>Badge (e.g. DROP 04)<input className="admin-input" value={s.badge ?? ""} onChange={(e) => patch({ badge: e.target.value })} /></label>
            <label className="wide">Text<textarea className="admin-input" value={s.sub} onChange={(e) => patch({ sub: e.target.value })} /></label>
            <label>Main button text<input className="admin-input" value={s.cta.label} onChange={(e) => patch({ cta: { ...s.cta, label: e.target.value } })} /></label>
            <label>Main button goes to<input className="admin-input" value={s.cta.to} placeholder="/shop" onChange={(e) => patch({ cta: { ...s.cta, to: e.target.value } })} /></label>
            <label>Second button text<input className="admin-input" value={s.secondary?.label ?? "Why so smol?"} onChange={(e) => patch({ secondary: { to: s.secondary?.to ?? "/about", label: e.target.value } })} /></label>
            <label>Second button goes to<input className="admin-input" value={s.secondary?.to ?? "/about"} onChange={(e) => patch({ secondary: { label: s.secondary?.label ?? "Why so smol?", to: e.target.value } })} /></label>
            <label>Layout<select className="admin-input" value={s.preset} onChange={(e) => patch({ preset: e.target.value as Preset })}>
              {Object.entries(PRESETS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}</select></label>
            <label>Starts<input className="admin-input" type="datetime-local" value={s.startsAt?.slice(0, 16) ?? ""} onChange={(e) => patch({ startsAt: e.target.value || undefined })} /></label>
            <label>Ends<input className="admin-input" type="datetime-local" value={s.endsAt?.slice(0, 16) ?? ""} onChange={(e) => patch({ endsAt: e.target.value || undefined })} /></label>
            <label>Picture tilt: {s.rotation ?? 0}°<input type="range" min={-10} max={10} value={s.rotation ?? 0} onChange={(e) => patch({ rotation: Number(e.target.value) })} /></label>
            <label className="wide">Picture
              <span className="admin-row">
                {s.image && <img className="admin-thumb" src={s.image} alt="" />}
                <AdminUpload token={token} accept="image/*" label="Upload picture" onDone={(url) => patch({ image: url })} />
                {s.image && <button className="admin-btn ghost" type="button" onClick={() => patch({ image: undefined })}>Remove</button>}
              </span></label>
            <label className="wide">Sticker
              <span className="admin-sticker-pick">
                {stickers.map((x) => <button type="button" key={x.id} title={x.label} className={x.id === s.sticker ? "on" : ""} onClick={() => patch({ sticker: x.id })}>{x.src ? <img src={x.src} alt={x.label} /> : x.label}</button>)}
              </span></label>
          </div>
          <h2>Preview</h2>
          <div className="admin-preview"><SlideBody s={s} extra={site.stickers.custom} /></div>
        </section>
      )}
    </>
  );
}

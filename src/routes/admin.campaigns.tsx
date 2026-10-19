import { pageHead } from "@/lib/page-head";
import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PRESETS, STICKERS, slideStatus, type Preset, type Slide, type HeroLayer } from "@/data/drops";
import { adminSaveSetting } from "@/lib/admin.functions";
import { useSite } from "@/lib/site";
import { SlideBody } from "@/components/smol/DropsHero";
import { AdminUpload } from "@/components/smol/AdminUpload";
import { useAdminToken } from "@/lib/admin-session";

export const Route = createFileRoute("/admin/campaigns")({ head: () => pageHead("Hero slides", "SMOL STUUF hero slides administration."), component: Campaigns });

const blank = (): Slide => ({ id: `slide-${Date.now().toString(36)}`, eyebrow: "NEW DROP", title: "NEW THING.", accent: "BIG MOOD.", sub: "Say something smol and weird.", cta: { label: "Shop the drop", to: "/shop" }, sticker: "drop", preset: "split" });

function Campaigns() {
  const token = useAdminToken();
  const site = useSite();
  const qc = useQueryClient();
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [sel, setSel] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [interval, setIntervalSeconds] = useState<number | null>(null);
  const [canvasView, setCanvasView] = useState<"desktop" | "mobile">("desktop");
  const [dragging, setDragging] = useState<"sticker" | "image" | null>(null);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
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
  const setCanvasPosition = (kind: "sticker" | "image", e: React.PointerEvent<HTMLDivElement>) => { const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return; const x = Math.round(Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100))); const y = Math.round(Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100))); if (canvasView === "mobile") patch(kind === "sticker" ? { mobileStickerX: x, mobileStickerY: y } : { mobileImageX: x, mobileImageY: y }); else patch(kind === "sticker" ? { stickerX: x, stickerY: y } : { imageX: x, imageY: y }); };
  const stickers = [...STICKERS, ...site.stickers.custom].filter((x) => !site.stickers.hidden.includes(x.id) && !site.stickers.inactive.includes(x.id));
  const layers: HeroLayer[] = s?.layers ?? [];
  const patchLayer = (id: string, values: Partial<HeroLayer>) => patch({ layers: layers.map((layer) => layer.id === id ? { ...layer, ...values } : layer) });
  const addLayer = (layer: HeroLayer) => { patch({ layers: [...layers, layer] }); setSelectedLayerId(layer.id); };
  const dragLayerTo = (id: string, e: React.PointerEvent<HTMLElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const x = Math.round(Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)));
    const y = Math.round(Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100)));
    patchLayer(id, { x, y });
  };

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
          <div className="hero-layer-tools">
            <div className="admin-row">
              <button type="button" className="admin-btn ghost" onClick={() => addLayer({ id: `text-${Date.now()}`, kind: "text", text: "Your text", x: 50, y: 35 })}>+ Text layer</button>
              <button type="button" className="admin-btn ghost" onClick={() => addLayer({ id: `button-${Date.now()}`, kind: "button", text: "Shop now", href: "/shop", x: 50, y: 78 })}>+ Button layer</button>
              <button type="button" className="admin-btn ghost" onClick={() => addLayer({ id: `sticker-${Date.now()}`, kind: "sticker", src: stickers.find(x => x.src)?.src, x: 78, y: 25, width: 18 })}>+ Sticker layer</button>
              <AdminUpload token={token} accept="image/*" label="+ Add media layer" onDone={(url) => addLayer({ id: `image-${Date.now()}`, kind: "image", src: url, x: 75, y: 60, width: 28 })} />
            </div>
            <p>Extra layers are independent of the original three presets. Select one to edit it; drag it directly in the preview.</p>
            {layers.map(layer => <div className="hero-layer-row" key={layer.id}>
              <button type="button" className={"admin-btn ghost " + (selectedLayerId === layer.id ? "active" : "")} onClick={() => setSelectedLayerId(layer.id)}>{layer.kind}: {layer.text || layer.id}</button>
              {(layer.kind === "text" || layer.kind === "button") && <input className="admin-input" aria-label="Layer text" value={layer.text ?? ""} onChange={e => patchLayer(layer.id, { text: e.target.value })} />}
              {layer.kind === "button" && <input className="admin-input" aria-label="Button destination" value={layer.href ?? "/shop"} onChange={e => patchLayer(layer.id, { href: e.target.value })} />}
              <label>Width % <input className="admin-input" type="number" min="4" max="100" value={layer.width ?? 18} onChange={e => patchLayer(layer.id, { width: Number(e.target.value) })} /></label>
              <button type="button" className="admin-btn danger" onClick={() => { patch({ layers: layers.filter(x => x.id !== layer.id) }); if (selectedLayerId === layer.id) setSelectedLayerId(null); }}>Remove</button>
            </div>)}
          </div>
          <div className="hero-canvas-toolbar"><div><h2>Hero canvas</h2><p>Drag artwork to position it. Desktop and mobile layouts are edited separately.</p></div><div className="hero-canvas-switch"><button type="button" className={canvasView === "desktop" ? "active" : ""} onClick={() => setCanvasView("desktop")}>Desktop</button><button type="button" className={canvasView === "mobile" ? "active" : ""} onClick={() => setCanvasView("mobile")}>Mobile</button></div></div>
          <div className="hero-canvas-settings"><label>Background color<input type="color" value={(canvasView === "mobile" ? s.mobileBackgroundColor : s.backgroundColor) ?? "#f5f0e5"} onChange={(e) => patch(canvasView === "mobile" ? { mobileBackgroundColor: e.target.value } : { backgroundColor: e.target.value })}/></label><label>Move element<select className="admin-input" value={dragging ?? "sticker"} onChange={(e) => setDragging(e.target.value as "sticker" | "image")}><option value="sticker">Hero sticker</option><option value="image" disabled={!s.image}>Hero image</option></select></label><button type="button" className="admin-btn ghost" onClick={() => patch(canvasView === "mobile" ? { mobileStickerX: undefined, mobileStickerY: undefined, mobileImageX: undefined, mobileImageY: undefined } : { stickerX: undefined, stickerY: undefined, imageX: undefined, imageY: undefined })}>Reset positions</button></div>
          <div className={"hero-canvas-shell " + canvasView}><div ref={canvasRef} className={"hero-drag-canvas " + canvasView} style={{ backgroundColor: (canvasView === "mobile" ? s.mobileBackgroundColor : s.backgroundColor) ?? "#f5f0e5" }} onPointerMove={(e) => { if (dragging) setCanvasPosition(dragging, e); }} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)}>
            <div className="hero-canvas-copy"><span>{s.eyebrow}</span><h2>{s.title}<br/><em>{s.accent}</em></h2><p>{s.sub}</p><b>{s.cta.label} →</b></div>
            {(() => { const sticker = stickers.find((x) => x.id === s.sticker); const x = canvasView === "mobile" ? s.mobileStickerX ?? s.stickerX ?? 78 : s.stickerX ?? 78; const y = canvasView === "mobile" ? s.mobileStickerY ?? s.stickerY ?? 22 : s.stickerY ?? 22; return <button type="button" className="hero-canvas-object sticker" style={{ left: x + "%", top: y + "%" }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging("sticker"); }} aria-label="Drag hero sticker">{sticker?.src ? <img src={sticker.src} alt="" draggable={false}/> : <b>{s.sticker}</b>}<span>Sticker · drag</span></button>; })()}
            {layers.map(layer => <button key={layer.id} type="button" className={"hero-canvas-object hero-canvas-layer " + layer.kind + (selectedLayerId === layer.id ? " selected" : "")} style={{ left: layer.x + "%", top: layer.y + "%", width: layer.width ? layer.width + "%" : undefined, transform: `translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg)` }} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setSelectedLayerId(layer.id); setDragLayerId(layer.id); }} onPointerMove={e => { if (dragLayerId === layer.id && e.buttons > 0) dragLayerTo(layer.id, e); }} onPointerUp={() => setDragLayerId(null)} onPointerCancel={() => setDragLayerId(null)} aria-label={"Drag " + layer.kind}>
              {(layer.kind === "image" || layer.kind === "sticker") && layer.src ? <img src={layer.src} alt="" draggable={false} /> : null}
              {(layer.kind === "text" || layer.kind === "button") && <b>{layer.text}</b>}
              <span>{layer.kind} · drag</span>
            </button>)}
            {s.image && <button type="button" className="hero-canvas-object image" style={{ left: (canvasView === "mobile" ? s.mobileImageX ?? s.imageX ?? 76 : s.imageX ?? 76) + "%", top: (canvasView === "mobile" ? s.mobileImageY ?? s.imageY ?? 60 : s.imageY ?? 60) + "%" }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging("image"); }} aria-label="Drag hero image"><img src={s.image} alt="" draggable={false}/><span>Image · drag</span></button>}
          </div></div>
        </section>
      )}
    </>
  );
}

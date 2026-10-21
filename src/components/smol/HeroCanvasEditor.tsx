import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Lock, Unlock, Monitor, Smartphone, Plus, Redo2, Undo2, Trash2, Type, ImagePlus, MousePointer2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminUpload } from './AdminUpload';
import { CanvasStage, CanvasContent, elementStyle } from './HeroCanvas';
import { CANVAS_COLORS, CANVAS_WIDTH, canvasId, constrainRect, createHeroCanvas, newHeroElement, type CanvasMode, type CanvasRect, type HeroCanvas, type HeroElement } from '@/lib/hero-canvas';
import type { Slide } from '@/data/drops';

// Number box that keeps what the person is typing: a value is applied as soon as it is valid,
// and out-of-range values are clamped when the box loses focus (so "500" can be typed digit by digit).
function NumberField({ label, value, onCommit }: { label: string; value: number; onCommit: (n: number, final: boolean) => void }) {
  const [draft, setDraft] = useState(String(value));
  const [tick, setTick] = useState(0);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(String(value)); }, [value, tick]);
  const parsed = (text: string) => (text.trim() !== '' && Number.isFinite(Number(text)) ? Number(text) : null);
  return <input className="admin-input" type="number" aria-label={label} value={draft}
    onFocus={() => { focused.current = true; }}
    onChange={e => { setDraft(e.target.value); const n = parsed(e.target.value); if (n !== null) onCommit(n, false); }}
    onBlur={() => { focused.current = false; const n = parsed(draft); if (n !== null) onCommit(n, true); setTick(t => t + 1); }} />;
}

export function HeroCanvasEditor({ slide, token, stickers, extra, onChange }: { slide: Slide; token: string; stickers: { id: string; label: string; src: string }[]; extra: { id: string; src: string }[]; onChange: (canvas: HeroCanvas | undefined) => void }) {
  const [mode, setMode] = useState<CanvasMode>('desktop');
  const [selected, select] = useState<string | null>(null);
  const [snap, setSnap] = useState(true);
  const [search, setSearch] = useState('');
  const [past, setPast] = useState<HeroCanvas[]>([]);
  const [future, setFuture] = useState<HeroCanvas[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; startX: number; startY: number; before: HeroCanvas; rect: CanvasRect; resize: boolean; scale: number; last: HeroCanvas } | null>(null);
  const canvas = slide.canvas;
  const current = canvas?.elements.find(e => e.id === selected);
  const commit = (next: HeroCanvas) => {
    if (canvas) setPast(p => [...p.slice(-49), canvas]);
    setFuture([]); onChange(next);
  };
  const update = (patch: Partial<HeroElement>) => { if (canvas && current) commit({ ...canvas, elements: canvas.elements.map(e => e.id === current.id ? { ...e, ...patch } : e) }); };
  const rectUpdate = (patch: Partial<CanvasRect>) => { if (canvas && current) update({ [mode]: constrainRect({ ...current[mode], ...patch }, mode, canvas[mode].height) }); };
  const setNum = (key: keyof CanvasRect, n: number, final: boolean) => {
    if (!canvas || !current) return;
    const next = constrainRect({ ...current[mode], [key]: n }, mode, canvas[mode].height);
    if ((!final && next[key] !== n) || next[key] === current[mode][key]) return;
    update({ [mode]: next });
  };
  const setHeight = (n: number, final: boolean) => {
    if (!canvas) return;
    const h = Math.max(300, Math.min(1800, n));
    if ((!final && h !== n) || h === canvas[mode].height) return;
    commit({ ...canvas, [mode]: { ...canvas[mode], height: h }, elements: canvas.elements.map(el => ({ ...el, [mode]: constrainRect(el[mode], mode, h) })) });
  };
  const add = (e: HeroElement) => { if (!canvas) return; commit({ ...canvas, elements: [...canvas.elements, e] }); select(e.id); };
  const undo = () => { const last = past.at(-1); if (!last || !canvas) return; setPast(p => p.slice(0, -1)); setFuture(f => [...f, canvas]); onChange(last); };
  const redo = () => { const next = future.at(-1); if (!next || !canvas) return; setFuture(f => f.slice(0, -1)); setPast(p => [...p, canvas]); onChange(next); };
  const startDrag = (event: PointerEvent<HTMLDivElement>, e: HeroElement, resize = false) => {
    event.stopPropagation(); select(e.id);
    if (e.locked || !canvas || !stage.current) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: e.id, startX: event.clientX, startY: event.clientY, before: canvas, rect: e[mode], resize, scale: stage.current.getBoundingClientRect().width / CANVAS_WIDTH[mode], last: canvas };
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (event.clientX - d.startX) / d.scale, dy = (event.clientY - d.startY) / d.scale;
    const round = (v: number) => snap ? Math.round(v / 8) * 8 : Math.round(v);
    const r = constrainRect({ ...d.rect, ...(d.resize ? { width: round(d.rect.width + dx), height: round(d.rect.height + dy) } : { x: round(d.rect.x + dx), y: round(d.rect.y + dy) }) }, mode, d.before[mode].height);
    d.last = { ...d.before, elements: d.before.elements.map(e => e.id === d.id ? { ...e, [mode]: r } : e) };
    onChange(d.last);
  };
  const stopDrag = (cancel = false) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (cancel) { onChange(d.before); return; }
    if (JSON.stringify(d.last) !== JSON.stringify(d.before)) { setPast(p => [...p.slice(-49), d.before]); setFuture([]); }
  };
  const reorder = (delta: number) => {
    if (!canvas || !current) return;
    const next = [...canvas.elements], i = next.findIndex(e => e.id === current.id), j = i + delta;
    const other = next[j];
    if (!other) return;
    next[i] = other; next[j] = current; commit({ ...canvas, elements: next });
  };
  const icon = (title: string, Icon: typeof Plus, action: () => void, disabled = false) => <Button type="button" variant="outline" size="icon" title={title} aria-label={title} onClick={action} disabled={disabled}><Icon /></Button>;
  if (!canvas) return <div className="canvas-enable"><h2>Hero canvas</h2><Button type="button" onClick={() => onChange(createHeroCanvas(slide))}><MousePointer2 /> Edit as canvas</Button></div>;
  return <section className="canvas-workspace" aria-label="Hero canvas editor">
    <div className="canvas-toolbar">
      <h2>Hero canvas</h2>
      <div className="canvas-tools" role="group" aria-label="Preview size">
        <Button type="button" variant={mode === 'desktop' ? 'default' : 'outline'} size="sm" onClick={() => setMode('desktop')}><Monitor /> Desktop</Button>
        <Button type="button" variant={mode === 'mobile' ? 'default' : 'outline'} size="sm" onClick={() => setMode('mobile')}><Smartphone /> Mobile</Button>
      </div>
      <div className="canvas-tools">{icon('Undo', Undo2, undo, !past.length)}{icon('Redo', Redo2, redo, !future.length)}<label className="canvas-check"><input type="checkbox" checked={snap} onChange={e => setSnap(e.target.checked)} /> Snap</label></div>
      <label className="canvas-height">Height<NumberField label="Canvas height" value={canvas[mode].height} onCommit={setHeight} /></label>
      {icon('Return to classic layout', RotateCcw, () => { if (confirm('Return to classic layout? Canvas layers will be removed after publishing.')) onChange(undefined); })}
    </div>
    <div className="canvas-columns">
      <aside className="canvas-layers">
        <div className="canvas-tools">{icon('Add text', Type, () => add(newHeroElement('text', 'New text')))}{icon('Add button', Plus, () => add(newHeroElement('button', 'Shop now')))}</div>
        <AdminUpload token={token} accept="image/*" label="Add image" onDone={(src, file) => { const e = newHeroElement('image', '', src); add({ ...e, name: file.name }); }} />
        <h3>Layers</h3>
        <div className="canvas-layer-list">{[...canvas.elements].reverse().map(e => <div key={e.id} className={`canvas-layer-row ${selected === e.id ? 'selected' : ''}`}><Button variant="ghost" className="canvas-layer-select" onClick={() => select(e.id)} title={e.name}>{e.name}</Button><Button variant="ghost" size="icon" title={e.hidden ? 'Show layer' : 'Hide layer'} aria-label={`${e.hidden ? 'Show' : 'Hide'} ${e.name}`} onClick={() => commit({ ...canvas, elements: canvas.elements.map(x => x.id === e.id ? { ...x, hidden: !x.hidden } : x) })}>{e.hidden ? <EyeOff /> : <Eye />}</Button></div>)}</div>
        <h3>Stickers</h3><input aria-label="Search stickers" className="admin-input" placeholder="Search stickers" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="canvas-sticker-grid">{stickers.filter(s => s.label.toLowerCase().includes(search.toLowerCase())).map(s => <Button type="button" key={s.id} variant="outline" title={`Add ${s.label}`} aria-label={`Add ${s.label}`} draggable onDragStart={event => event.dataTransfer.setData('text/plain', s.id)} onClick={() => { const e = newHeroElement('sticker', '', s.id); add({ ...e, name: s.label }); }}><img src={s.src} alt="" /></Button>)}</div>
      </aside>
      <div className="canvas-area" onDragOver={e => e.preventDefault()} onDrop={event => {
        event.preventDefault(); const sticker = stickers.find(s => s.id === event.dataTransfer.getData('text/plain')); if (!sticker || !stage.current) return;
        const box = stage.current.getBoundingClientRect(), scale = box.width / CANVAS_WIDTH[mode], e = newHeroElement('sticker', '', sticker.id);
        add({ ...e, name: sticker.label, [mode]: constrainRect({ ...e[mode], x: (event.clientX - box.left) / scale, y: (event.clientY - box.top) / scale }, mode, canvas[mode].height) });
      }}>
        <CanvasStage canvas={canvas} mode={mode} stageRef={stage}>{canvas.elements.filter(e => !e.hidden).map(e => <div key={e.id} data-layer-id={e.id} aria-label={`Canvas layer ${e.name}`} tabIndex={0} className={`canvas-element canvas-kind-${e.kind} canvas-edit-element canvas-fg-${e.color} canvas-bg-${e.kind === "text" ? "transparent" : e.background} ${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")} ${selected === e.id ? 'is-selected' : ''} ${e.locked ? 'is-locked' : ''}`} style={elementStyle(e, mode)} onPointerDown={event => startDrag(event, e)} onPointerMove={moveDrag} onPointerUp={() => stopDrag()} onPointerCancel={() => stopDrag(true)} onFocus={() => select(e.id)} onKeyDown={event => {
          if (e.locked || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault(); const step = event.shiftKey ? 10 : 1;
          commit({ ...canvas, elements: canvas.elements.map(x => x.id === e.id ? { ...x, [mode]: constrainRect({ ...x[mode], x: x[mode].x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y: x[mode].y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) }, mode, canvas[mode].height) } : x) });
        }}><CanvasContent element={e} extra={extra} editing />{selected === e.id && !e.locked && <div role="slider" aria-label={`Resize ${e.name}`} tabIndex={0} className="canvas-resize-handle" onPointerDown={event => startDrag(event, e, true)} onPointerMove={moveDrag} onPointerUp={() => stopDrag()} onPointerCancel={() => stopDrag(true)} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); rectUpdate({ width: e[mode].width + 8, height: e[mode].height + 8 }); } if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); rectUpdate({ width: e[mode].width - 8, height: e[mode].height - 8 }); } }} />}</div>)}</CanvasStage>
      </div>
      <aside className="canvas-inspector"><h3>{current?.name ?? 'Select a layer'}</h3>{current && <>
        <label>Layer name<input className="admin-input" value={current.name} onChange={e => update({ name: e.target.value })} /></label>
        {(current.kind === 'text' || current.kind === 'button') && <label>Text<textarea className="admin-input" value={current.text} onChange={e => update({ text: e.target.value })} /></label>}
        {current.kind === 'button' && <label>Link<input className="admin-input" value={current.href} onChange={e => update({ href: e.target.value })} /></label>}
        {(current.kind === 'image' || current.kind === 'logo') && <AdminUpload token={token} accept="image/*" label="Replace image" onDone={src => update({ src })} />}
        {current.kind === 'sticker' && <label>Artwork<select className="admin-input" value={current.src} onChange={e => update({ src: e.target.value })}>{stickers.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>}
        <fieldset disabled={current.locked}><div className="canvas-numbers">{(['x', 'y', 'width', 'height', 'rotation', 'fontSize'] as const).map(key => <label key={key}>{key === 'fontSize' ? 'Font size' : key}<NumberField label={`Layer ${key}`} value={current[mode][key]} onCommit={(n, final) => setNum(key, n, final)} /></label>)}</div></fieldset>
        <label>Alignment<select className="admin-input" value={current.align} onChange={e => update({ align: e.target.value as HeroElement['align'] })}><option>left</option><option>center</option><option>right</option></select></label>
        <label className="canvas-check"><input type="checkbox" checked={current.bold} onChange={e => update({ bold: e.target.checked })} /> Bold</label>
        <label>Text color<select className="admin-input" value={current.color} onChange={e => update({ color: e.target.value as HeroElement['color'] })}>{CANVAS_COLORS.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Fill<select className="admin-input" value={current.background} onChange={e => update({ background: e.target.value as HeroElement['background'] })}><option>transparent</option>{CANVAS_COLORS.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Motion<select className="admin-input" value={current.animation ?? (current.kind === 'button' ? 'bounce-shadow' : 'none')} onChange={e => update({ animation: e.target.value as HeroElement['animation'] })}><option value="none">No animation</option><option value="bounce-shadow">GSAP bounce + shadow drop</option></select></label>
        {current.kind === 'button' && <fieldset className="canvas-style-fields"><legend>Button border & shadow</legend>
          <div className="canvas-numbers">
            <label>Border width<NumberField label="Border width" value={current.borderWidth ?? 3} onCommit={n => update({ borderWidth: Math.max(0, Math.min(16, n)) })} /></label>
            <label>Corner radius<NumberField label="Corner radius" value={current.borderRadius ?? 999} onCommit={n => update({ borderRadius: Math.max(0, Math.min(999, n)) })} /></label>
            <label>Shadow X<NumberField label="Shadow horizontal offset" value={current.shadowX ?? 4} onCommit={n => update({ shadowX: Math.max(-40, Math.min(40, n)) })} /></label>
            <label>Shadow Y<NumberField label="Shadow vertical offset" value={current.shadowY ?? 4} onCommit={n => update({ shadowY: Math.max(-40, Math.min(40, n)) })} /></label>
            <label>Shadow blur<NumberField label="Shadow blur" value={current.shadowBlur ?? 0} onCommit={n => update({ shadowBlur: Math.max(0, Math.min(40, n)) })} /></label>
          </div>
          <label>Border color<select className="admin-input" value={current.borderColor ?? 'ink'} onChange={e => update({ borderColor: e.target.value as HeroElement['borderColor'] })}>{CANVAS_COLORS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Shadow color<select className="admin-input" value={current.shadowColor ?? 'ink'} onChange={e => update({ shadowColor: e.target.value as HeroElement['shadowColor'] })}>{CANVAS_COLORS.map(c => <option key={c}>{c}</option>)}</select></label>
        </fieldset>}
        <div className="canvas-tools">{icon('Bring forward', ArrowUp, () => reorder(1))}{icon('Send backward', ArrowDown, () => reorder(-1))}{icon('Duplicate layer', Copy, () => add({ ...current, id: canvasId(), name: `${current.name} copy`, desktop: { ...current.desktop, x: current.desktop.x + 16 }, mobile: { ...current.mobile, x: current.mobile.x + 8 } }))}{icon(current.locked ? 'Unlock layer' : 'Lock layer', current.locked ? Unlock : Lock, () => update({ locked: !current.locked }))}{icon('Delete layer', Trash2, () => { commit({ ...canvas, elements: canvas.elements.filter(e => e.id !== current.id) }); select(null); })}</div>
      </>}</aside>
    </div>
  </section>;
}

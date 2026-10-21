import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { stickerSrc } from '@/data/drops';
import { CANVAS_WIDTH, safeHeroHref, type CanvasMode, type HeroCanvas, type HeroElement } from '@/lib/hero-canvas';

export function CanvasStage({ canvas, mode, children, stageRef }: { canvas: HeroCanvas; mode: CanvasMode; children: ReactNode; stageRef?: React.Ref<HTMLDivElement> }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setScale(el.clientWidth / CANVAS_WIDTH[mode]));
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);
  return <div ref={host} className={`hero-canvas-host canvas-${mode}`} style={{ height: canvas[mode].height * scale }}>
    <div ref={stageRef} className={`hero-canvas-stage canvas-bg-${canvas[mode].background}`} style={{ width: CANVAS_WIDTH[mode], height: canvas[mode].height, transform: `scale(${scale})` }}>{children}</div>
  </div>;
}
export function elementStyle(e: HeroElement, mode: CanvasMode): CSSProperties {
  const r = e[mode];
  return { left: r.x, top: r.y, width: r.width, height: r.height, transform: `rotate(${r.rotation}deg)`, fontSize: r.fontSize, textAlign: e.align, fontWeight: e.bold ? 900 : 400 };
}
export function CanvasContent({ element: e, extra, editing = false, onLogoClick }: { element: HeroElement; extra?: { id: string; src: string }[] | undefined; editing?: boolean; onLogoClick?: (() => void) | undefined }) {
  const art = e.kind === 'image' || e.kind === 'sticker' || e.kind === 'logo';
  const content = art ? <img src={e.kind === 'sticker' ? stickerSrc(e.src, extra) : e.src} alt={e.name} draggable={false} /> : e.text;
  if (e.kind === 'button' && !editing) return <Button asChild className="canvas-link"><a href={safeHeroHref(e.href)}>{content}</a></Button>;
  if (e.kind === 'logo' && !editing) return <Button variant="ghost" className="canvas-logo" onClick={onLogoClick} aria-label="SMOL STUUF hand-drawn logo">{content}</Button>;
  return <div className={`canvas-content ${e.bold ? 'canvas-bold' : ''} ${e.kind === 'button' ? 'canvas-link' : ''}`}>{content}</div>;
}
export function HeroCanvasView({ canvas, extra, onLogoClick }: { canvas: HeroCanvas; extra?: { id: string; src: string }[] | undefined; onLogoClick?: (() => void) | undefined }) {
  const render = (mode: CanvasMode) => <CanvasStage canvas={canvas} mode={mode}>{canvas.elements.filter(e => !e.hidden).map(e => <div key={e.id} className={`canvas-element canvas-fg-${e.color} canvas-bg-${e.background}`} style={elementStyle(e, mode)}><CanvasContent element={e} extra={extra} onLogoClick={onLogoClick} /></div>)}</CanvasStage>;
  return <section className="published-hero-canvas" aria-label="SMOL STUUF drop">{render('desktop')}{render('mobile')}</section>;
}

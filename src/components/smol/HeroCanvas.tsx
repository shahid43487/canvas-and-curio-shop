import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
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
    <div ref={stageRef} className="hero-canvas-stage canvas-bg-paper" style={{ width: CANVAS_WIDTH[mode], height: canvas[mode].height, transform: `scale(${scale})` }}>{children}</div>
  </div>;
}
export function elementStyle(e: HeroElement, mode: CanvasMode): CSSProperties {
  const r = e[mode];
  return { left: r.x, top: r.y, width: r.width, height: r.height, transform: `rotate(${r.rotation}deg)`, fontSize: r.fontSize, textAlign: e.align, fontWeight: e.bold ? 900 : 400,
    ...(e.kind === 'button' ? { border: (e.borderWidth ?? 3) > 0 ? `${e.borderWidth ?? 3}px solid var(--smol-${e.borderColor ?? 'ink'})` : 'none', borderRadius: `${e.borderRadius ?? 999}px`, boxShadow: e.shadowEnabled ? `${e.shadowX ?? 4}px ${e.shadowY ?? 4}px ${e.shadowBlur ?? 0}px var(--smol-${e.shadowColor ?? 'ink'})` : 'none', '--canvas-hover-shadow': `${e.hoverShadowX ?? 5}px ${e.hoverShadowY ?? 6}px 0 var(--smol-ink)`, '--canvas-hover-lift': `${-(e.hoverLift ?? 3)}px`, '--canvas-hover-rotation': `${e.hoverRotation ?? -1}deg`, '--canvas-hover-enabled': e.hoverEffect ?? (e.kind === 'button') ? 1 : 0, '--canvas-base-shadow': e.shadowEnabled ? `${e.shadowX ?? 4}px ${e.shadowY ?? 4}px ${e.shadowBlur ?? 0}px var(--smol-${e.shadowColor ?? 'ink'})` : 'none', '--canvas-base-background': e.background === 'transparent' ? 'transparent' : `var(--smol-${e.background})`, '--canvas-base-color': `var(--smol-${e.color})` } as CSSProperties : {}) };
}
export function CanvasContent({ element: e, extra, editing = false, onLogoClick }: { element: HeroElement; extra?: { id: string; src: string }[] | undefined; editing?: boolean; onLogoClick?: (() => void) | undefined }) {
  const art = e.kind === 'image' || e.kind === 'sticker' || e.kind === 'logo';
  const content = art ? <img src={e.kind === 'sticker' ? stickerSrc(e.src, extra) : e.src} alt={e.name} draggable={false} /> : e.text;
  if (e.kind === 'button' && !editing) return <Button asChild className="canvas-link"><a href={safeHeroHref(e.href)}>{content}</a></Button>;
  if (e.kind === 'logo' && !editing) return <Button variant="ghost" className="canvas-logo" onClick={onLogoClick} aria-label="SMOL STUUF hand-drawn logo">{content}</Button>;
  return <div className={`canvas-content ${e.bold ? 'canvas-bold' : ''} ${e.kind === 'button' ? 'canvas-link' : ''}`}>{content}</div>;
}
export function HeroCanvasView({ canvas, extra, onLogoClick }: { canvas: HeroCanvas; extra?: { id: string; src: string }[] | undefined; onLogoClick?: (() => void) | undefined }) {
  const render = (mode: CanvasMode) => <CanvasStage canvas={canvas} mode={mode}>{canvas.elements.filter(e => !e.hidden).map(e => <div key={e.id} className={`canvas-element canvas-kind-${e.kind} canvas-fg-${e.color} canvas-bg-${e.kind === "text" ? "transparent" : e.background} ${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} data-canvas-animation={e.animation ?? 'none'} data-canvas-shadow={e.shadowEnabled ? 'true' : 'false'} data-hover-effect={(e.hoverEffect ?? e.kind === 'button') ? 'true' : 'false'} style={elementStyle(e, mode)}><CanvasContent element={e} extra={extra} onLogoClick={onLogoClick} /></div>)}</CanvasStage>;
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const targets = scope.querySelectorAll<HTMLElement>('[data-canvas-animation="bounce-shadow"]');
    const ctx = gsap.context(() => {
      targets.forEach((el, index) => {
        const computed = getComputedStyle(el);
        const hasShadow = el.dataset['canvasShadow'] === 'true';
        gsap.set(el, { y: -18, ...(hasShadow ? { boxShadow: '0px 0px 0px rgba(22,27,83,0)' } : {}), transformOrigin: '50% 50%' });
        gsap.to(el, { y: 0, ...(hasShadow ? { boxShadow: computed.boxShadow } : {}), duration: 0.72, delay: index * 0.075, ease: 'bounce.out', clearProps: 'y' });
      });
    }, scope);
    return () => ctx.revert();
  }, [canvas]);
  return <section ref={root} className="published-hero-canvas" aria-label="SMOL STUUF drop">{render('desktop')}{render('mobile')}</section>;
}

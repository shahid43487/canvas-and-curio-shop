import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { liveSlides, SLIDES, stickerSrc, type Slide, type HeroLayer } from "@/data/drops";
import { useSite } from "@/lib/site";

// Rotates live STUUF DROPS slides (edited in /admin/campaigns) inside the hero markup.
export function DropsHero() {
  const site = useSite();
  const live = site ? liveSlides(site.slides) : [];
  const slides = live.length ? live : SLIDES.slice(0, 1);
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      if (!box.current) return;
      gsap.to(box.current, { opacity: 0, y: -12, duration: 0.25, onComplete: () => setI((n) => (n + 1) % slides.length) });
    }, (site?.slideInterval ?? 6) * 1000);
    return () => clearInterval(id);
  }, [slides.length, site?.slideInterval]);
  useEffect(() => {
    if (box.current) gsap.fromTo(box.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" });
  }, [i]);

  const current = slides[i % slides.length];
  if (!current) return null;
  return <div ref={box}><SlideBody s={current} extra={site?.stickers.custom} dots={slides.length > 1 ? { n: slides.length, i, set: setI } : undefined} /></div>;
}

export function SlideBody({ s, extra, dots }: { s: Slide; extra?: { id: string; src: string }[] | undefined; dots?: { n: number; i: number; set: (n: number) => void } | undefined }) {
  const img = stickerSrc(s.sticker, extra);
  const label = STICKER_TEXT[s.sticker];
  return (
    <div data-preset={s.preset} className="drops-slide-body" style={{ backgroundColor: s.backgroundColor || undefined, "--mobile-slide-bg": s.mobileBackgroundColor || s.backgroundColor || "transparent" } as React.CSSProperties}>
      {img ? <img src={img} alt="" className="drop-sticker" style={{ left: `${s.stickerX ?? 78}%`, top: `${s.stickerY ?? 22}%` }} width={96} height={96} decoding="async" /> : <span className="sticker slide-text-sticker s1">{label ?? "GOOD STUUF ✓"}</span>}
      <div className="eyebrow-tag"><span className="dot" /> {s.eyebrow}</div>
      <h1 className="hero-title">{s.title}<br /><span className="accent">{s.accent}</span></h1>
      <p className="hero-sub">{s.sub}</p>
      <div className="hero-ctas">
        <Link to={s.cta.to as "/shop"} className="btn-primary">{s.cta.label}</Link>
        <Link to={(s.secondary?.to ?? "/about") as "/about"} className="btn-outline">{s.secondary?.label ?? "Why so smol?"}</Link>
      </div>
      {s.image && <img src={s.image} alt="" className="drop-slide-image" style={{ rotate: `${s.rotation ?? 0}deg`, left: `${s.imageX ?? 76}%`, top: `${s.imageY ?? 60}%` }} />}
      {s.badge && <span className="drop-badge">{s.badge}</span>}
      {(s.layers ?? []).map((layer: HeroLayer) => {
        const style: React.CSSProperties = { left: `${layer.x}%`, top: `${layer.y}%`, width: layer.width ? `${layer.width}%` : undefined, transform: `translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg)` };
        if (layer.kind === "image" || layer.kind === "sticker") return layer.src ? <img key={layer.id} src={layer.src} alt="" className={layer.kind === "sticker" ? "drop-sticker drop-extra-layer" : "drop-slide-image drop-extra-layer"} style={style} /> : null;
        if (layer.kind === "button") return <Link key={layer.id} to={(layer.href || "/shop") as "/shop"} className="btn-primary drop-extra-layer" style={style}>{layer.text || "Shop now"}</Link>;
        return <span key={layer.id} className="drop-extra-text drop-extra-layer" style={style}>{layer.text || "Text"}</span>;
      })}
      {dots && <div className="drop-dots">{Array.from({ length: dots.n }, (_, n) => <button key={n} aria-label={`Slide ${n + 1}`} className={n === dots.i ? "on" : ""} onClick={() => dots.set(n)} />)}</div>}
    </div>
  );
}
const STICKER_TEXT: Record<string, string> = { good: "GOOD STUUF ✓", drop: "DROP 04" };

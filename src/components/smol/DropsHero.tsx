import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { liveSlides, SLIDES, stickerSrc, type Slide } from "@/data/drops";
import { useSite } from "@/lib/site";
import { HeroCanvasView } from "./HeroCanvas";
import { StickerField } from "./StickerField";
import { Button } from "@/components/ui/button";
import logo from "@/assets/smol-stuuf-logo.png";
import { assetUrl } from "@/lib/asset-url";

// Rotates live STUUF DROPS slides (edited in /admin/campaigns) inside the hero markup.
export function DropsHero({ onLogoClick }: { onLogoClick?: (() => void) | undefined }) {
  const site = useSite();
  const live = site ? liveSlides(site.slides) : [];
  const slides = live.length ? live : SLIDES.slice(0, 1);
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setInterval(() => {
      if (!box.current) return;
      if (reduced) { setI(n => (n + 1) % slides.length); return; }
      gsap.to(box.current, { opacity: 0, y: -12, duration: 0.25, onComplete: () => setI((n) => (n + 1) % slides.length) });
    }, (site?.slideInterval ?? 6) * 1000);
    return () => { clearInterval(id); if (box.current) gsap.killTweensOf(box.current); };
  }, [slides.length, site?.slideInterval]);
  useEffect(() => {
    if (!box.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.set(box.current, { opacity: 1, y: 0 });
    else gsap.fromTo(box.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" });
  }, [i]);

  const current = slides[i % slides.length];
  if (!current) return null;
  const canvas = current.canvas?.version === 1 && Array.isArray(current.canvas.elements) ? current.canvas : undefined;
  return <div className="hero-slider"><div ref={box}>{canvas ? <HeroCanvasView canvas={canvas} extra={site?.stickers.custom} onLogoClick={onLogoClick} /> : <div className="hero dots"><StickerField /><div className="wrap hero-inner"><SlideBody s={current} extra={site?.stickers.custom} /><div className="hero-logo-art"><Button type="button" variant="ghost" className="hero-secret-trigger" onClick={onLogoClick} aria-label="SMOL STUUF hand-drawn logo"><img src={assetUrl(logo)} alt="" /></Button><span className="sticker red s2">DROP 04</span></div></div></div>}</div>{slides.length > 1 && <div className="hero-slider-dots">{slides.map((s, n) => <Button key={s.id} variant="ghost" size="icon" aria-label={`Slide ${n + 1}`} aria-pressed={n === i % slides.length} onClick={() => setI(n)}><span /></Button>)}</div>}</div>;
}

export function SlideBody({ s, extra, dots }: { s: Slide; extra?: { id: string; src: string }[] | undefined; dots?: { n: number; i: number; set: (n: number) => void } | undefined }) {
  const img = stickerSrc(s.sticker, extra);
  const label = STICKER_TEXT[s.sticker];
  return (
    <div data-preset={s.preset}>
      {img ? <img src={img} alt="" className="drop-sticker" width={96} height={96} decoding="async" /> : <span className="sticker slide-text-sticker s1">{label ?? "GOOD STUUF ✓"}</span>}
      <div className="eyebrow-tag"><span className="dot" /> {s.eyebrow}</div>
      <h1 className="hero-title">{s.title}<br /><span className="accent">{s.accent}</span></h1>
      <p className="hero-sub">{s.sub}</p>
      <div className="hero-ctas">
        <Link to={s.cta.to as "/shop"} className="btn-primary">{s.cta.label}</Link>
        <Link to={(s.secondary?.to ?? "/about") as "/about"} className="btn-outline">{s.secondary?.label ?? "Why so smol?"}</Link>
      </div>
      {s.image && <img src={s.image} alt="" className="drop-slide-image" style={{ rotate: `${s.rotation ?? 0}deg` }} />}
      {s.badge && <span className="drop-badge">{s.badge}</span>}
      {dots && <div className="drop-dots">{Array.from({ length: dots.n }, (_, n) => <button key={n} aria-label={`Slide ${n + 1}`} className={n === dots.i ? "on" : ""} onClick={() => dots.set(n)} />)}</div>}
    </div>
  );
}
const STICKER_TEXT: Record<string, string> = { good: "GOOD STUUF ✓", drop: "DROP 04" };

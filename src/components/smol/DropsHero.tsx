import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { liveSlides, SLIDES, stickerSrc } from "@/data/drops";

// Rotates live STUUF DROPS slides inside the existing hero markup.
export function DropsHero() {
  const [slides, setSlides] = useState(SLIDES.slice(0, 1));
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { const l = liveSlides(); if (l.length) setSlides(l); }, []);
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      if (!box.current) return;
      gsap.to(box.current, { opacity: 0, y: -12, duration: 0.25, onComplete: () => setI((n) => (n + 1) % slides.length) });
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);
  useEffect(() => {
    if (box.current) gsap.fromTo(box.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" });
  }, [i]);

  const s = slides[i % slides.length]!;
  const img = stickerSrc(s.sticker);
  return (
    <div ref={box} data-preset={s.preset}>
      {img ? <img src={img} alt="" className="drop-sticker" width={96} height={96} /> : <span className="sticker s1">GOOD STUUF ✓</span>}
      <div className="eyebrow-tag"><span className="dot" /> {s.eyebrow}</div>
      <h1 className="hero-title">{s.title}<br /><span className="accent">{s.accent}</span></h1>
      <p className="hero-sub">{s.sub}</p>
      <div className="hero-ctas">
        <Link to={s.cta.to} className="btn-primary">{s.cta.label}</Link>
        <Link to="/about" className="btn-outline">Why so smol?</Link>
      </div>
      {slides.length > 1 && (
        <div className="drop-dots">{slides.map((x, n) => <button key={x.id} aria-label={`Slide ${n + 1}`} className={n === i ? "on" : ""} onClick={() => setI(n)} />)}</div>
      )}
    </div>
  );
}

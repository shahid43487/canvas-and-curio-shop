import { useEffect, useState } from "react";

type Burst = { id: number; x: number; y: number; symbol: string };
const SYMBOLS = ["★", "✦", "●", "SMOL", "STUUF"] as const;

export function StickerBurst() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timers = new Set<number>();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (reduced || !(target instanceof Element) || !target.closest("a, button")) return;
      const id = nextId++;
      setBursts((items) => [...items.slice(-7), { id, x: event.clientX, y: event.clientY, symbol: SYMBOLS[id % SYMBOLS.length] ?? "★" }]);
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        setBursts((items) => items.filter((item) => item.id !== id));
      }, 720);
      timers.add(timer);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <div className="burst-layer" aria-hidden="true">
      {bursts.map((burst) => (
        <span key={burst.id} className={`click-sticker click-sticker-${burst.id % 3}`} style={{ left: burst.x, top: burst.y }}>
          {burst.symbol}
        </span>
      ))}
    </div>
  );
}
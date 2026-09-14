import { useEffect, useState } from "react";

type Burst = { id: number; x: number; y: number; symbol: string };
const SYMBOLS = ["★", "✦", "●", "SMOL", "STUUF"] as const;

export function StickerBurst() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    let nextId = 0;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("a, button")) return;
      const id = nextId++;
      setBursts((items) => [...items.slice(-7), { id, x: event.clientX, y: event.clientY, symbol: SYMBOLS[id % SYMBOLS.length] ?? "★" }]);
      window.setTimeout(() => setBursts((items) => items.filter((item) => item.id !== id)), 720);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
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
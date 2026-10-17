import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { PacIcon, Variation } from "@/data/products";
import { Button } from "@/components/ui/button";
import { playSfx } from "@/lib/sfx";

// Wedge path: mouth half-angle `a` in degrees (0 = closed).
function pacPath(a: number) {
  const r = 10;
  const rad = (a * Math.PI) / 180;
  const x = 12 + r * Math.cos(rad);
  const y = r * Math.sin(rad);
  return `M12 12 L${x} ${12 - y} A${r} ${r} 0 1 0 ${x} ${12 + y} Z`;
}

function PacMan({ icon, index }: { icon: PacIcon; index: number }) {
  const s = icon.size ?? 22;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      className="pac-icon"
      style={{ transform: `rotate(${icon.rotation ?? 0}deg) scaleX(${icon.flip ? -1 : 1})`, zIndex: 10 - index }}
      aria-hidden="true"
    >
      <path className="pac-body" d={pacPath(32)} fill={icon.color} stroke="var(--smol-ink, currentColor)" strokeWidth="1.4" data-delay={icon.delay ?? index * 0.06} />
    </svg>
  );
}

function PacButton({ v, selected, onSelect }: { v: Variation; selected: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const icons = v.button_config.icons?.length ? v.button_config.icons.slice(0, 10) : [{ color: "#FFD23F" }];
  const out = v.stock <= 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (!selected) {
        gsap.to(el, { scale: 1, duration: 0.2, ease: "power2.out" });
        return;
      }
      if (reduce) {
        gsap.set(el, { scale: 1.08 });
        return;
      }
      gsap.timeline()
        .to(el, { scale: 0.94, duration: 0.08, ease: "power2.in" })
        .to(el, { scale: 1.08, duration: 0.45, ease: "elastic.out(1.1, 0.45)" });
      el.querySelectorAll<SVGPathElement>(".pac-body").forEach((path) => {
        const mouth = { a: 32 };
        gsap.to(mouth, {
          a: 2,
          duration: 0.18,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: Number(path.dataset["delay"] ?? 0),
          onUpdate: () => path.setAttribute("d", pacPath(mouth.a)),
        });
      });
    }, el);
    return () => {
      ctx.revert(); // kills chomp loops + resets mouth/scale
    };
  }, [selected, v.button_config]);

  return (
    <Button
      ref={ref}
      type="button"
      className={`pac-btn arr-${v.button_config.arrangement ?? "row"}${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      aria-label={`${v.name}${out ? " (sold out)" : ""}`}
      title={v.name}
      disabled={out}
      onClick={() => { playSfx("chomp"); onSelect(); }}
    >
      <span className="pac-icons">
        {icons.map((icon, i) => <PacMan key={i} icon={icon} index={i} />)}
      </span>
      <span className="pac-label">{v.name}</span>
    </Button>
  );
}

export function VariationSelector({
  mode,
  variations,
  selectedId,
  onSelect,
}: {
  mode: string;
  variations: Variation[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  if (mode === "color") {
    return (
      <div className="colorways" role="group" aria-label="Choose a color">
        {variations.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`dotc dotc-btn button-spring${v.id === selectedId ? " is-selected" : ""}`}
            style={{ background: v.button_config.color ?? "currentColor" }}
            aria-pressed={v.id === selectedId}
            aria-label={`${v.name}${v.stock <= 0 ? " (sold out)" : ""}`}
            title={v.name}
            disabled={v.stock <= 0}
            onClick={() => onSelect(v.id)}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="pac-selector" role="group" aria-label="Choose an option">
      {variations.map((v) => (
        <PacButton key={v.id} v={v} selected={v.id === selectedId} onSelect={() => onSelect(v.id)} />
      ))}
    </div>
  );
}

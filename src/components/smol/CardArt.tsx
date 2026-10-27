import { parseLayers, type CardDraft } from "@/lib/club";
type Props = { card: Pick<CardDraft, "title" | "description" | "design" | "rarity" | "motion_enabled" | "shadow_enabled" | "border_enabled"> & { layers: unknown }; serial?: string; locked?: boolean };
// Every part is its own layer: the svg root keeps its static tilt while inner
// <g class="ca-part-*"> groups animate (transform-box: fill-box), so artwork
// tilt is preserved and motion is pure CSS (see styles.css).
function Deco({ design }: { design: CardDraft["design"] }) {
  switch (design) {
    case "smile":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-bob">
            <circle cx="50" cy="50" r="40" fill="var(--smol-yellow)" stroke="var(--smol-ink)" strokeWidth="5" />
            <g className="ca-part-blink">
              <circle cx="37" cy="41" r="5" fill="var(--smol-ink)" /><circle cx="63" cy="41" r="5" fill="var(--smol-ink)" />
            </g>
            <path d="M28 58 Q50 82 72 58" fill="none" stroke="var(--smol-ink)" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      );
    case "ghost":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-float">
            <path d="M20 90V45a30 30 0 0 1 60 0v45l-10-9-10 9-10-9-10 9-10-9z" fill="var(--smol-paper)" stroke="var(--smol-ink)" strokeWidth="5" strokeLinejoin="round" />
            <circle cx="40" cy="48" r="5" fill="var(--smol-ink)" /><circle cx="60" cy="48" r="5" fill="var(--smol-ink)" />
            <ellipse cx="50" cy="63" rx="6" ry="8" fill="var(--smol-ink)" />
          </g>
        </svg>
      );
    case "bolt":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-pulse">
            <path d="M55 5 25 55h22l-8 40 36-55H53z" fill="var(--smol-yellow)" stroke="var(--smol-ink)" strokeWidth="5" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case "dark":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="40" fill="var(--smol-paper)" stroke="var(--smol-ink)" strokeWidth="5" />
          <g className="ca-part-spin">
            <path d="M50 22l7 18 19 1-15 12 5 19-16-11-16 11 5-19-15-12 19-1z" fill="var(--smol-ink)" />
          </g>
        </svg>
      );
    case "ticket":
      // Cafe cup with rising steam — the retro-ticket variation.
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-float">
            <g className="ca-part-steam">
              <path d="M40 16q-4 6 0 13" fill="none" stroke="var(--smol-ink)" strokeWidth="4" strokeLinecap="round" />
              <path d="M54 12q-4 8 0 16" fill="none" stroke="var(--smol-ink)" strokeWidth="4" strokeLinecap="round" />
            </g>
            <path d="M28 36h40l-5 40a8 8 0 0 1-8 7H41a8 8 0 0 1-8-7z" fill="var(--smol-paper)" stroke="var(--smol-ink)" strokeWidth="5" strokeLinejoin="round" />
            <path d="M68 42h5a9 9 0 0 1 0 18h-7" fill="none" stroke="var(--smol-ink)" strokeWidth="5" />
            <path d="M24 88h50" stroke="var(--smol-ink)" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      );
    default:
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-bob">
            <path d="M10 60h50l-6-30h26l8 30h12v14h-8a10 10 0 0 1-20 0H44a10 10 0 0 1-20 0h-14z" fill="var(--smol-paper)" stroke="var(--smol-ink)" strokeWidth="5" strokeLinejoin="round" />
            <g className="ca-part-spin">
              <circle cx="30" cy="74" r="6" fill="var(--smol-ink)" /><circle cx="66" cy="74" r="6" fill="var(--smol-ink)" />
            </g>
          </g>
        </svg>
      );
  }
}

export function CardArt({ card, serial, locked }: Props) {
  return <div className={`club-card-art ca-${card.design} ${card.motion_enabled && !locked ? "club-motion" : ""} ${card.shadow_enabled ? "club-shadow" : ""} ${card.border_enabled ? "club-border" : ""} ${locked ? "club-locked" : ""}`} role="img" aria-label={locked ? "Locked collectible card" : card.title}>
    <div className="club-card-face"><span className="club-card-brand">SMOL CLUB / {card.rarity.toUpperCase()}</span><Deco design={card.design}/><h3>{locked ? "LOCKED" : card.title}</h3><p>{locked ? "A little legend awaits." : card.description}</p><small>{serial || "PERMANENT COLLECTIBLE"}</small></div>
    <svg className="club-card-layers" viewBox="0 0 300 380" aria-hidden="true">{parseLayers(card.layers).filter(l => l.visible).map(l => <g key={l.id} transform={`translate(${l.x} ${l.y}) rotate(${l.rotation})`} className={`club-tone-${l.tone}`}><g className={`club-layer-${l.motion}`}>{l.kind === "text" ? <text fontSize={l.size} textAnchor="middle">{l.text}</text> : l.kind === "circle" ? <circle r={l.size/2}/> : <text fontSize={l.size} textAnchor="middle">✦</text>}</g></g>)}</svg>
  </div>;
}

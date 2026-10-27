import type { CouponDesign } from "@/lib/coupon";

type Props = {
  design: CouponDesign;
  lines: string[];
  note: string;
  code: string;
  valid?: string | null;
  /** Thumbnail: headline only, scales with its container. */
  compact?: boolean;
  className?: string;
};

// Every part is its own layer: the svg root keeps its static tilt while inner
// <g class="ca-part-*"> groups animate (transform-box: fill-box), so artwork
// tilt is preserved and motion is pure CSS (see styles.css).
function Deco({ design }: { design: CouponDesign }) {
  switch (design) {
    case "smile":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-bob">
            <circle cx="50" cy="50" r="40" fill="#ffd400" stroke="#111a52" strokeWidth="5" />
            <g className="ca-part-blink">
              <circle cx="37" cy="41" r="5" fill="#111a52" /><circle cx="63" cy="41" r="5" fill="#111a52" />
            </g>
            <path d="M28 58 Q50 82 72 58" fill="none" stroke="#111a52" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      );
    case "ghost":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-float">
            <path d="M20 90V45a30 30 0 0 1 60 0v45l-10-9-10 9-10-9-10 9-10-9z" fill="#fff" stroke="#111a52" strokeWidth="5" strokeLinejoin="round" />
            <circle cx="40" cy="48" r="5" fill="#111a52" /><circle cx="60" cy="48" r="5" fill="#111a52" />
            <ellipse cx="50" cy="63" rx="6" ry="8" fill="#111a52" />
          </g>
        </svg>
      );
    case "bogo":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-pulse">
            <path d="M55 5 25 55h22l-8 40 36-55H53z" fill="#ffd400" stroke="#111a52" strokeWidth="5" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case "dark":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="40" fill="#fff" stroke="#111" strokeWidth="5" />
          <g className="ca-part-spin">
            <path d="M50 22l7 18 19 1-15 12 5 19-16-11-16 11 5-19-15-12 19-1z" fill="#111" />
          </g>
        </svg>
      );
    case "ticket":
      // Cafe cup with rising steam — the retro-ticket variation.
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-float">
            <g className="ca-part-steam">
              <path d="M40 16q-4 6 0 13" fill="none" stroke="#111a52" strokeWidth="4" strokeLinecap="round" />
              <path d="M54 12q-4 8 0 16" fill="none" stroke="#111a52" strokeWidth="4" strokeLinecap="round" />
            </g>
            <path d="M28 36h40l-5 40a8 8 0 0 1-8 7H41a8 8 0 0 1-8-7z" fill="#fff" stroke="#111a52" strokeWidth="5" strokeLinejoin="round" />
            <path d="M68 42h5a9 9 0 0 1 0 18h-7" fill="none" stroke="#111a52" strokeWidth="5" />
            <path d="M24 88h50" stroke="#111a52" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      );
    default:
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <g className="ca-part-bob">
            <path d="M10 60h50l-6-30h26l8 30h12v14h-8a10 10 0 0 1-20 0H44a10 10 0 0 1-20 0h-14z" fill="#fff" stroke="#111a52" strokeWidth="5" strokeLinejoin="round" />
            <g className="ca-part-spin">
              <circle cx="30" cy="74" r="6" fill="#111a52" /><circle cx="66" cy="74" r="6" fill="#111a52" />
            </g>
          </g>
        </svg>
      );
  }
}

export function CouponArt({ design, lines, note, code, valid, compact, className }: Props) {
  return (
    <div className={`coupon-art ca-${design}${compact ? " ca-compact" : ""}${className ? ` ${className}` : ""}`} role="img" aria-label={`${lines.join(" ")} coupon ${code}`}>
      <div className="ca-face">
        {!compact && <span className="ca-brand">SMOL<br />STUUF ✶</span>}
        <div className="ca-lines">{lines.map((l, i) => <span key={`${i}-${l}`} style={{ animationDelay: `${i * 0.12}s` }}>{l}</span>)}</div>
        {!compact && (
          <>
            <Deco design={design} />
            <p className="ca-note">{note}</p>
            <span className="ca-code">USE CODE: {code}</span>
            {valid && <small className="ca-valid">VALID UNTIL {valid.toUpperCase()}</small>}
          </>
        )}
      </div>
    </div>
  );
}

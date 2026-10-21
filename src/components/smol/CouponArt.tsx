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

function Deco({ design }: { design: CouponDesign }) {
  switch (design) {
    case "smile":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="40" fill="#ffd400" stroke="#111a52" strokeWidth="5" />
          <circle cx="37" cy="41" r="5" fill="#111a52" /><circle cx="63" cy="41" r="5" fill="#111a52" />
          <path d="M28 58 Q50 82 72 58" fill="none" stroke="#111a52" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case "ghost":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M20 90V45a30 30 0 0 1 60 0v45l-10-9-10 9-10-9-10 9-10-9z" fill="#fff" stroke="#111a52" strokeWidth="5" strokeLinejoin="round" />
          <circle cx="40" cy="48" r="5" fill="#111a52" /><circle cx="60" cy="48" r="5" fill="#111a52" />
          <ellipse cx="50" cy="63" rx="6" ry="8" fill="#111a52" />
        </svg>
      );
    case "bogo":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M55 5 25 55h22l-8 40 36-55H53z" fill="#ffd400" stroke="#111a52" strokeWidth="5" strokeLinejoin="round" />
        </svg>
      );
    case "dark":
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="40" fill="#fff" stroke="#111" strokeWidth="5" />
          <path d="M50 22l7 18 19 1-15 12 5 19-16-11-16 11 5-19-15-12 19-1z" fill="#111" />
        </svg>
      );
    default:
      return (
        <svg className="ca-deco" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M10 60h50l-6-30h26l8 30h12v14h-8a10 10 0 0 1-20 0H44a10 10 0 0 1-20 0h-14z" fill="#fff" stroke="#111a52" strokeWidth="5" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function CouponArt({ design, lines, note, code, valid, compact, className }: Props) {
  return (
    <div className={`coupon-art ca-${design}${compact ? " ca-compact" : ""}${className ? ` ${className}` : ""}`} role="img" aria-label={`${lines.join(" ")} coupon ${code}`}>
      <div className="ca-face">
        {!compact && <span className="ca-brand">SMOL<br />STUUF ✶</span>}
        <div className="ca-lines">{lines.map((l) => <span key={l}>{l}</span>)}</div>
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

export function StickerField({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "sticker-field compact" : "sticker-field"} aria-hidden="true">
      <span className="float-sticker sticker-eye"><i /></span>
      <span className="float-sticker sticker-star">STUUF</span>
      <span className="float-sticker sticker-hand">✌</span>
      <span className="float-sticker sticker-badge">GOOD<br />STUUF</span>
      <span className="float-sticker sticker-spark">✦</span>
    </div>
  );
}
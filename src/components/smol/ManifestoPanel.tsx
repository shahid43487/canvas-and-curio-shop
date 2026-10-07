import { MarqueeAlongSvgPath } from "./MarqueeAlongSvgPath";

const statements = [
  {
    number: "01",
    title: "PERFECTION IS BORING.",
    copy: "Every wobble tray and desk buddy is built layer by tiny layer. If it's a little crooked, that's where the soul lives.",
    note: "(measured with feelings, not rulers)",
  },
  {
    number: "02",
    title: "HUMAN WARMTH ONLY.",
    copy: "Assembled by actual hands, not conveyor belts. Zero sterile corners, maximum warm glow.",
    note: "(yes, a real person glued this)",
  },
  {
    number: "03",
    title: "POCKET-SIZED CHAOS.",
    copy: "Little objects that punch way above their weight class. Smol package, enormous attitude.",
    note: "(do not underestimate)",
  },
];

const stamps = ["100% NOT BORING", "HUMAN-ASSEMBLED", "ZERO SHARP CORNERS"];

export function ManifestoPanel() {
  return (
    <section className="manifesto wrap" aria-labelledby="manifesto-title">
      <div className="manifesto-moving-ribbon"><MarqueeAlongSvgPath text="HANDMADE — WITH CHAOS — AND LOVE — SMOL STUUF — " /></div>
      <div className="zine-board">
        <span className="zine-tape t1" aria-hidden="true" />
        <span className="zine-tape t2" aria-hidden="true" />
        <h2 id="manifesto-title">THE SMOL <span>MANIFESTO</span></h2>
        <div className="zine-list">
          {statements.map((s) => (
            <article className="zine-item" key={s.number}>
              <strong className="zine-stamp">{s.number}</strong>
              <h3>{s.title}</h3>
              <p>{s.copy}</p>
              <em className="zine-note">{s.note}</em>
            </article>
          ))}
        </div>
        <div className="zine-badges" aria-hidden="true">
          {stamps.map((b) => <span key={b}>{b}</span>)}
        </div>
      </div>
    </section>
  );
}

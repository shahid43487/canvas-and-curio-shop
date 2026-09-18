const statements = [
  {
    number: "01",
    title: "PRINTED, NOT PERFECT.",
    copy: "Every wobble tray and desk buddy is built layer by tiny layer. The wobbles are a feature.",
    icon: "◎",
  },
  {
    number: "02",
    title: "GLOW, HANDMADE.",
    copy: "Our tiny lights are assembled by actual human hands. Warm glow, zero boring corners.",
    icon: "☀",
  },
  {
    number: "03",
    title: "SMOL BUT MIGHTY.",
    copy: "Little objects that punch above their weight class. Small package, enormous personality.",
    icon: "✷",
  },
];

export function ManifestoPanel() {
  return (
    <section className="manifesto wrap" aria-labelledby="manifesto-title">
      <p className="manifesto-ribbon">HANDMADE — WITH CHAOS — AND LOVE — SMOL STUUF —</p>
      <h2 id="manifesto-title">THE SMOL <span>MANIFESTO</span></h2>
      <div className="manifesto-list">
        {statements.map((statement) => (
          <article className="manifesto-item" key={statement.number}>
            <strong className="manifesto-number">{statement.number}</strong>
            <div>
              <h3>{statement.title}</h3>
              <p>{statement.copy}</p>
            </div>
            <span className="manifesto-icon" aria-hidden="true">{statement.icon}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
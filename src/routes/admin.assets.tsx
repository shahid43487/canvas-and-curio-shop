import { createFileRoute } from "@tanstack/react-router";
import { PRESETS, STICKERS } from "@/data/drops";

export const Route = createFileRoute("/admin/assets")({ component: Assets });

function Assets() {
  return (
    <>
      <h1 className="admin-h1">Sticker vault & presets</h1>
      <section className="admin-panel"><h2>Stickers</h2>
        <div className="admin-grid">
          {STICKERS.map((s) => (
            <figure key={s.id}>{s.src ? <img src={s.src} alt={s.label} /> : <span className="sticker">{s.label}</span>}<figcaption><small>{s.id}</small></figcaption></figure>
          ))}
        </div>
      </section>
      <section className="admin-panel"><h2>Slide layouts</h2>
        <div className="admin-grid">
          {Object.entries(PRESETS).map(([k, p]) => <figure key={k}><b>{p.label}</b><p><small>{p.note}</small></p><code>{k}</code></figure>)}
        </div>
      </section>
    </>
  );
}

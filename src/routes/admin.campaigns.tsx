import { createFileRoute } from "@tanstack/react-router";
import { PRESETS, SLIDES, slideStatus, stickerSrc, type Slide } from "@/data/drops";

export const Route = createFileRoute("/admin/campaigns")({ component: Campaigns });

function Campaigns() {
  return (
    <>
      <h1 className="admin-h1">STUUF DROPS</h1>
      <p className="admin-panel">Homepage slides rotate every 6s. Only <b>live</b> slides show. Slides publish and unpublish themselves on their start and end times.</p>
      {SLIDES.map((s) => {
        const st = slideStatus(s);
        return (
          <section key={s.id} className="admin-panel">
            <div className="admin-row"><span className={`admin-badge ${st}`}>{st}</span><b>{s.id}</b><small>{PRESETS[s.preset].label} · CTA → {s.cta.to}</small>
              {(s.startsAt || s.endsAt) && <small>{s.startsAt ?? "now"} → {s.endsAt ?? "forever"}</small>}</div>
            <div className="admin-frames">
              <Frame s={s} cls="desk" label="Desktop" />
              <Frame s={s} cls="mob" label="Mobile" />
            </div>
          </section>
        );
      })}
    </>
  );
}

function Frame({ s, cls, label }: { s: Slide; cls: string; label: string }) {
  const img = stickerSrc(s.sticker);
  return (
    <div className={`admin-frame ${cls}`}>
      <small>{label}</small>
      {img && <img src={img} alt="" />}
      <div><small>{s.eyebrow}</small></div>
      <h3>{s.title} <span>{s.accent}</span></h3>
      <p>{s.sub}</p>
      <button className="admin-btn">{s.cta.label}</button>
    </div>
  );
}

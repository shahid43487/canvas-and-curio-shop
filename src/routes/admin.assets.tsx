import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PRESETS, STICKERS } from "@/data/drops";
import { adminSaveSetting } from "@/lib/admin.functions";
import { useSite, type StickerSettings } from "@/lib/site";
import { AdminUpload } from "@/components/smol/AdminUpload";
import { useAdminToken } from "@/lib/admin-session";

export const Route = createFileRoute("/admin/assets")({ head: () => pageHead("Sticker library", "SMOL STUUF sticker library administration."), component: Assets });

function Assets() {
  const token = useAdminToken();
  const site = useSite();
  const qc = useQueryClient();
  if (!site) return <p>Loading…</p>;
  const st = site.stickers;
  const save = async (value: StickerSettings, msg: string) => {
    try { await adminSaveSetting({ data: { token, key: "stickers", value } }); toast.success(msg); await qc.invalidateQueries({ queryKey: ["site-settings"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const toggle = (id: string) => save({ ...st, hidden: st.hidden.includes(id) ? st.hidden.filter((x) => x !== id) : [...st.hidden, id] }, "Updated");

  return (
    <>
      <div className="admin-row"><h1 className="admin-h1">Sticker library</h1>
        <AdminUpload token={token} accept="image/*" label="+ Upload sticker" onDone={(url, f) => save({ ...st, custom: [...st.custom, { id: `up-${Date.now().toString(36)}`, label: f.name.replace(/\.\w+$/, ""), src: url }] }, "Sticker added")} /></div>
      <section className="admin-panel"><h2>Your uploads ({st.custom.length})</h2>
        <div className="admin-grid">
          {st.custom.map((s) => (
            <figure key={s.id}><img src={s.src} alt={s.label} /><figcaption><small>{s.label}</small></figcaption>
              <button className="admin-btn danger" onClick={() => confirm("Delete this sticker?") && save({ ...st, custom: st.custom.filter((x) => x.id !== s.id) }, "Deleted")}>Delete</button></figure>
          ))}
        </div>
        {!st.custom.length && <small>Upload PNGs with transparent backgrounds for best results.</small>}
      </section>
      <section className="admin-panel"><h2>Built-in stickers & characters ({STICKERS.length})</h2>
        <p><small>Hidden ones won't appear in the slide sticker picker.</small></p>
        <div className="admin-grid">
          {STICKERS.map((s) => {
            const off = st.hidden.includes(s.id);
            return (
              <figure key={s.id} className={off ? "off" : ""}>{s.src ? <img src={s.src} alt={s.label} /> : <span className="sticker">{s.label}</span>}
                <figcaption><small>{s.label}</small></figcaption>
                <button className="admin-btn ghost" onClick={() => toggle(s.id)}>{off ? "Show" : "Hide"}</button></figure>
            );
          })}
        </div>
      </section>
      <section className="admin-panel"><h2>Slide layouts</h2>
        <div className="admin-grid">
          {Object.entries(PRESETS).map(([k, p]) => <figure key={k}><b>{p.label}</b><p><small>{p.note}</small></p></figure>)}
        </div>
      </section>
    </>
  );
}

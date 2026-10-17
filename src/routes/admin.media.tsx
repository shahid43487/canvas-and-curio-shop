import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminSaveSetting } from "@/lib/admin.functions";
import { useSite, type CustomSound, type SoundSettings } from "@/lib/site";
import { playSfx } from "@/lib/sfx";
import { AdminUpload } from "@/components/smol/AdminUpload";
import { useAdminToken } from "@/lib/admin-session";

export const Route = createFileRoute("/admin/media")({ component: Media });

const TRIGGERS: Record<CustomSound["trigger"], string> = { click: "Button clicks", cart: "Add to cart", chomp: "Option pick", none: "Not used" };

function Media() {
  const token = useAdminToken();
  const site = useSite();
  const qc = useQueryClient();
  const [s, set] = useState<SoundSettings | null>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (site && !s) set(site.sound); }, [site, s]);
  if (!s) return <p>Loading…</p>;
  const update = (p: Partial<SoundSettings>) => { set({ ...s, ...p }); setDirty(true); };
  const music = (p: Partial<SoundSettings["music"]>) => update({ music: { ...s.music, ...p } });
  const save = async () => {
    try { await adminSaveSetting({ data: { token, key: "sound", value: s } }); toast.success("Sound settings live"); setDirty(false); qc.invalidateQueries({ queryKey: ["site-settings"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <>
      <div className="admin-row"><h1 className="admin-h1">Media console</h1>
        <button className="admin-btn" disabled={!dirty} onClick={save}>{dirty ? "Publish" : "All saved"}</button></div>

      <section className="admin-panel"><h2>Master control</h2>
        <div className="admin-row"><span className={s.enabled ? "admin-led" : "admin-led on"} /><b>Website sound</b>
          <button className="admin-btn" onClick={() => update({ enabled: !s.enabled })}>{s.enabled ? "ON" : "OFF"}</button>
          <small>OFF hides the visitor sound button and silences everything.</small></div>
        <div className="admin-row">Effects volume <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => update({ volume: Number(e.target.value) })} /> {Math.round(s.volume * 100)}%</div>
      </section>

      <section className="admin-panel"><h2>Background music</h2>
        <div className="admin-row">
          <input type="checkbox" checked={s.music.enabled} onChange={(e) => music({ enabled: e.target.checked })} /> Play music
          <input type="checkbox" checked={s.music.loop} onChange={(e) => music({ loop: e.target.checked })} /> Loop
          Volume <input type="range" min={0} max={1} step={0.05} value={s.music.volume} onChange={(e) => music({ volume: Number(e.target.value) })} /> {Math.round(s.music.volume * 100)}%
        </div>
        <div className="admin-row">
          <b>{s.music.name || "No track yet"}</b>
          {s.music.url && <audio controls src={s.music.url} style={{ height: 32 }} />}
          <AdminUpload token={token} accept="audio/*" label={s.music.url ? "Replace track" : "Upload track"} onDone={(url, f) => music({ url, name: f.name, enabled: true })} />
          {s.music.url && <button className="admin-btn danger" onClick={() => music({ url: "", name: "", enabled: false })}>Remove</button>}
        </div>
        <small>Visitors hear it only after they tap “Sound on” — browsers block autoplay.</small>
      </section>

      <section className="admin-panel"><h2>Interface sounds</h2>
        {(["click", "cart", "chomp"] as const).map((k) => (
          <div key={k} className="admin-row">
            <input type="checkbox" checked={s[k]} onChange={(e) => update({ [k]: e.target.checked })} /> {TRIGGERS[k]}
            <small>{s.library.find((x) => x.trigger === k)?.name ?? "built-in bleep"}</small>
            <button className="admin-btn ghost" onClick={() => playSfx(k, true, s)}>Test</button>
          </div>
        ))}
      </section>

      <section className="admin-panel"><h2>Sound library</h2>
        {s.library.map((x) => (
          <div key={x.id} className="admin-row">
            <b>{x.name}</b>
            <audio controls src={x.url} style={{ height: 32 }} />
            <select className="admin-input" value={x.trigger} onChange={(e) => {
              const t = e.target.value as CustomSound["trigger"];
              update({ library: s.library.map((y) => (y.id === x.id ? { ...y, trigger: t } : t !== "none" && y.trigger === t ? { ...y, trigger: "none" } : y)) });
            }}>{Object.entries(TRIGGERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <button className="admin-btn danger" onClick={() => update({ library: s.library.filter((y) => y.id !== x.id) })}>Remove</button>
          </div>
        ))}
        {!s.library.length && <p><small>No custom sounds yet. Built-in bleeps are used.</small></p>}
        <AdminUpload token={token} accept="audio/*" label="+ Add sound" onDone={(url, f) => update({ library: [...s.library, { id: Date.now().toString(36), name: f.name, url, trigger: "none" }] })} />
      </section>
    </>
  );
}

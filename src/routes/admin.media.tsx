import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getSfx, playSfx, setSfx, type SfxSettings } from "@/lib/sfx";

export const Route = createFileRoute("/admin/media")({ component: Media });

function Media() {
  const [s, set] = useState<SfxSettings | null>(null);
  useEffect(() => set(getSfx()), []);
  if (!s) return null;
  const update = (p: Partial<SfxSettings>) => set(setSfx(p));
  const sounds = [["click", "Button click pops"], ["cart", "Cart drop rattle"], ["chomp", "Pac-Man bite crunch"]] as const;

  return (
    <>
      <h1 className="admin-h1">Media console</h1>
      <section className="admin-panel">
        <div className="admin-row"><span className={s.enabled ? "admin-led" : "admin-led on"} /><b>Master sound</b>
          <button className="admin-btn" onClick={() => update({ enabled: !s.enabled })}>{s.enabled ? "ON" : "OFF"}</button></div>
        <div className="admin-row">Volume <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => update({ volume: Number(e.target.value) })} /> {Math.round(s.volume * 100)}%</div>
        {sounds.map(([k, label]) => (
          <div key={k} className="admin-row">
            <input type="checkbox" checked={s[k]} onChange={(e) => update({ [k]: e.target.checked })} /> {label}
            <button className="admin-btn ghost" onClick={() => playSfx(k)}>Test</button>
          </div>
        ))}
        <small>Sounds only play after a visitor taps something. Nothing plays on its own when a page opens. These settings apply to this browser only.</small>
      </section>
    </>
  );
}

import { pageHead } from "@/lib/page-head";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminSaveSetting } from "@/lib/admin.functions";
import { useSite, type Socials } from "@/lib/site";
import { useAdminToken } from "@/lib/admin-session";

export const Route = createFileRoute("/admin/settings")({ head: () => pageHead("Settings", "SMOL STUUF settings administration."), component: Settings });

const FIELDS: [keyof Socials, string, string][] = [
  ["instagram", "Instagram", "https://instagram.com/smolstuuf"],
  ["facebook", "Facebook", "https://facebook.com/smolstuuf"],
  ["tiktok", "TikTok", "https://tiktok.com/@smolstuuf"],
  ["youtube", "YouTube", "https://youtube.com/@smolstuuf"],
  ["email", "Email", "hello@smolstuuf.com"],
];

function Settings() {
  const token = useAdminToken();
  const site = useSite();
  const qc = useQueryClient();
  const [f, setF] = useState<Socials | null>(null);
  useEffect(() => { if (site && !f) setF(site.socials); }, [site, f]);
  if (!f) return <p>Loading…</p>;
  return (
    <>
      <h1 className="admin-h1">Settings</h1>
      <form className="admin-panel" onSubmit={async (e) => {
        e.preventDefault();
        try { await adminSaveSetting({ data: { token, key: "socials", value: f } }); toast.success("Social links saved"); qc.invalidateQueries({ queryKey: ["site-settings"] }); }
        catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
      }}>
        <h2>Social media links</h2>
        <p><small>Shown in the site footer. Leave a box empty to hide that icon.</small></p>
        <div className="admin-form">
          {FIELDS.map(([k, label, ph]) => (
            <label key={k}>{label}<input className="admin-input" type={k === "email" ? "email" : "url"} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
          ))}
        </div>
        <button className="admin-btn">Save links</button>
      </form>
    </>
  );
}

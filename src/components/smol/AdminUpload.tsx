import { useState } from "react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/site";

export function AdminUpload({ token, accept, label = "Upload", onDone }: { token: string; accept: string; label?: string; onDone: (url: string, file: File) => void | Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="admin-btn ghost" style={{ cursor: "pointer" }}>
      {busy ? "Uploading…" : label}
      <input type="file" accept={accept} hidden disabled={busy} onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        const allowed = accept.split(",").map((value) => value.trim().toLowerCase());
        const matches = allowed.some((value) => value.endsWith("/*") ? f.type.startsWith(value.slice(0, -1)) : value.startsWith(".") ? f.name.toLowerCase().endsWith(value) : f.type === value);
        if (!matches) { toast.error("Choose a file of the requested type"); return; }
        setBusy(true);
        try { await onDone(await uploadMedia(token, f), f); }
        catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
        finally { setBusy(false); }
      }} />
    </label>
  );
}

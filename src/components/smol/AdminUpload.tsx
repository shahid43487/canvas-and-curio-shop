import { useState } from "react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/site";

export function AdminUpload({ token, accept, label = "Upload", onDone }: { token: string; accept: string; label?: string; onDone: (url: string, file: File) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="admin-btn ghost" style={{ cursor: "pointer" }}>
      {busy ? "Uploading…" : label}
      <input type="file" accept={accept} hidden disabled={busy} onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        setBusy(true);
        try { onDone(await uploadMedia(token, f), f); }
        catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
        finally { setBusy(false); }
      }} />
    </label>
  );
}

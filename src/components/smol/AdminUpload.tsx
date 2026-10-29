import { useState } from "react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/site";
import { UploadButtonGroup } from "@/components/smol/UploadButtonGroup";

export function AdminUpload({ token, accept, label = "Upload", onDone }: { token: string; accept: string; label?: string; onDone: (url: string, file: File) => void | Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const allowed = accept.split(",").map((value) => value.trim().toLowerCase());

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const matches = allowed.some((value) =>
      value.endsWith("/*") ? file.type.startsWith(value.slice(0, -1)) :
      value.startsWith(".") ? file.name.toLowerCase().endsWith(value) :
      file.type === value
    );
    if (!matches) { toast.error("Choose a file of the requested type"); return; }
    setBusy(true);
    try {
      await onDone(await uploadMedia(token, file), file);
      setUploadedName(file.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <UploadButtonGroup
      accept={accept}
      actionLabel={busy ? "Uploading…" : label}
      countLabel={busy ? "Uploading file…" : uploadedName || "Choose file"}
      disabled={busy}
      onFile={handleFile}
    />
  );
}

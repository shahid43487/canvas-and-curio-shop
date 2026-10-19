import { useEffect, useState } from "react";
import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PRESETS, STICKERS } from "@/data/drops";
import { adminSaveSetting } from "@/lib/admin.functions";
import { useSite, type StickerSettings, type CustomSticker, type DialogueSettings, type DialogueSequence } from "@/lib/site";
import { AdminUpload } from "@/components/smol/AdminUpload";
import { useAdminToken } from "@/lib/admin-session";

export const Route = createFileRoute("/admin/assets")({ head: () => pageHead("Sticker library", "SMOL STUUF sticker library administration."), component: Assets });

type StickerStatus = "active" | "inactive" | "hidden";
type LibrarySticker = { id: string; label: string; src: string; category: string; tags: string[]; isBuiltIn: boolean; status: StickerStatus };

const runtimeUsage: Record<string, string[]> = {
  "shop-character": ["GrandpaPopup · ambient visitor reactions"],
  "cart-fierce-character": ["CartSheet · cart reactions", "CheckoutSpeaker · checkout reactions", "SecretTransition · doorway dialogue"],
};

function categoryFor(id: string) {
  if (/babu|character/i.test(id)) return "character";
  if (/drop|good|sticker/i.test(id)) return "badge";
  return "sticker";
}
function tagsFor(id: string) {
  return id.split(/[-_\s]+/).filter(Boolean);
}

function Assets() {
  const token = useAdminToken();
  const site = useSite();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"library" | "controls">("library");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StickerStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dimensions, setDimensions] = useState<Record<string, string>>({});
  const [dialogueDraft, setDialogueDraft] = useState<DialogueSettings>({ status: "draft", sequences: [
    { id: "cart-idle", name: "Cart idle reactions", trigger: "Cart idle", priority: 0, enabled: true, lines: [
      { line: "ভাই… আর কত ভাববেন?", expression: "unimpressed", delayMs: 15000 },
      { line: "নিবেন যখন, তখন নেন।", expression: "hmm", delayMs: 15000 },
    ] },
    { id: "checkout-payment", name: "Checkout payment reaction", trigger: "Payment method changes", priority: 1, enabled: true, lines: [
      { line: "ওহ! আগেই মিটায় ফেললেন?", expression: "shocked" },
      { line: "বাহ, বিশ্বাস আছে দেখতেছি!", expression: "laugh" },
    ] },
    { id: "checkout-error", name: "Checkout validation / error", trigger: "Validation or order error", priority: 2, enabled: true, lines: [
      { line: "ভাই, কিছু তথ্য তো লাগবো।", expression: "nervous" },
      { line: "নাম-ঠিকানা ছাড়া জিনিস পাঠামু কই?", expression: "facepalm" },
    ] },
  ] });
  const [selectedSequence, setSelectedSequence] = useState("cart-idle");
  const [previewIndex, setPreviewIndex] = useState(0);
  useEffect(() => {
    if (site?.dialogue) setDialogueDraft({ ...site.dialogue, status: site.dialogue.draftSequences ? "draft" : site.dialogue.status, sequences: site.dialogue.draftSequences ?? site.dialogue.sequences });
  }, [site?.dialogue]);
  if (!site) return <p>Loading…</p>;
  const st = site.stickers;
  const selected = dialogueDraft.sequences.find((sequence) => sequence.id === selectedSequence) ?? dialogueDraft.sequences[0];
  const updateSequence = (id: string, patch: Partial<DialogueSequence>) => setDialogueDraft((current) => ({ ...current, status: "draft", sequences: current.sequences.map((sequence) => sequence.id === id ? { ...sequence, ...patch } : sequence) }));
  const updateLine = (sequenceId: string, index: number, patch: Partial<DialogueSequence["lines"][number]>) => setDialogueDraft((current) => ({ ...current, status: "draft", sequences: current.sequences.map((sequence) => sequence.id === sequenceId ? { ...sequence, lines: sequence.lines.map((line, i) => i === index ? { ...line, ...patch } : line) } : sequence) }));
  const addSequence = () => {
    const id = `sequence-${Date.now().toString(36)}`;
    setDialogueDraft((current) => ({ ...current, status: "draft", sequences: [...current.sequences, { id, name: "New sequence", trigger: "Manual / future trigger", priority: 1, enabled: false, lines: [{ line: "Write a line…", expression: "hmm" }] }] }));
    setSelectedSequence(id);
  };
  const saveDialogue = async (status: "draft" | "published") => {
    const invalid = dialogueDraft.sequences.find((sequence) => !sequence.name.trim() || !sequence.lines.length || sequence.lines.some((line) => !line.line.trim() || !line.expression.trim()));
    if (invalid) { toast.error("Each sequence needs a name and at least one complete dialogue line."); return; }
    try {
      const updatedAt = new Date().toISOString();
      const published = site?.dialogue?.sequences ?? [];
      const value: DialogueSettings = status === "draft"
        ? { status: site?.dialogue?.status === "published" ? "published" : "draft", sequences: published, draftSequences: dialogueDraft.sequences, updatedAt }
        : { status: "published", sequences: dialogueDraft.sequences, updatedAt };
      await adminSaveSetting({ data: { token, key: "dialogue", value } });
      setDialogueDraft({ status, sequences: dialogueDraft.sequences, updatedAt });
      toast.success(status === "published" ? "Dialogue configuration published" : "Dialogue draft saved");
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save dialogue configuration"); }
  };

  const save = async (value: StickerSettings, msg: string) => {
    try {
      await adminSaveSetting({ data: { token, key: "stickers", value } });
      toast.success(msg);
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const statusOf = (id: string): StickerStatus =>
    st.hidden.includes(id) ? "hidden" : st.inactive.includes(id) ? "inactive" : "active";

  const setStatus = (id: string, status: StickerStatus) => {
    const hidden = st.hidden.filter((x) => x !== id);
    const inactive = st.inactive.filter((x) => x !== id);
    if (status === "hidden") hidden.push(id);
    if (status === "inactive") inactive.push(id);
    return save({ ...st, hidden, inactive }, `Sticker marked ${status}`);
  };

  const updateCustom = (id: string, patch: Partial<CustomSticker>) =>
    save({ ...st, custom: st.custom.map((sticker) => sticker.id === id ? { ...sticker, ...patch } : sticker) }, "Sticker details saved");

  const entries: LibrarySticker[] = [
    ...STICKERS.map((sticker) => ({
      ...sticker,
      category: categoryFor(sticker.id),
      tags: tagsFor(sticker.id),
      isBuiltIn: true,
      status: statusOf(sticker.id),
    })),
    ...st.custom.map((sticker) => ({
      ...sticker,
      category: sticker.category?.trim() || "custom",
      tags: sticker.tags ?? [],
      isBuiltIn: false,
      status: statusOf(sticker.id),
    })),
  ];
  const categories = [...new Set(entries.map((entry) => entry.category))].sort();
  const filtered = entries.filter((entry) => {
    const haystack = [entry.id, entry.label, entry.category, ...entry.tags].join(" ").toLowerCase();
    return (!search.trim() || haystack.includes(search.trim().toLowerCase()))
      && (statusFilter === "all" || entry.status === statusFilter)
      && (categoryFilter === "all" || entry.category === categoryFilter);
  });

  const referencesFor = (entry: LibrarySticker) => {
    const slides = site.slides.filter((slide) => slide.sticker === entry.id).map((slide) => `Homepage slide: ${slide.title} ${slide.accent}`.trim());
    return [...(runtimeUsage[entry.id] ?? []), ...slides];
  };

  return (
    <>
      <div className="admin-row">
        <h1 className="admin-h1">Sticker Library</h1>
        <AdminUpload token={token} accept="image/*" label="+ Upload sticker" onDone={(url, file) => save({
          ...st,
          custom: [...st.custom, {
            id: `up-${Date.now().toString(36)}`,
            label: file.name.replace(/\.\w+$/, ""),
            src: url,
            category: "custom",
            tags: [],
          }],
        }, "Sticker added")} />
      </div>

      <nav className="admin-tabs" aria-label="Sticker administration sections">
        <button type="button" className="admin-btn ghost" aria-pressed={tab === "library"} onClick={() => setTab("library")}>Sticker Library</button>
        <button type="button" className="admin-btn ghost" aria-pressed={tab === "controls"} onClick={() => setTab("controls")}>Sticker Controls</button>
      </nav>

      {tab === "controls" ? (
        <section className="admin-panel">
          <div className="admin-row"><div><h2>Dialogue sequences</h2><p><small>Edit dialogue lines, expressions, trigger notes and priority. Shared reading windows remain unchanged.</small></p></div><span className={`sticker-status ${dialogueDraft.status === "published" ? "active" : "inactive"}`}>{dialogueDraft.status}</span></div>
          <div className="sticker-library-tools">
            <label>Sequence<select value={selected?.id ?? ""} onChange={(event) => { setSelectedSequence(event.target.value); setPreviewIndex(0); }}>{dialogueDraft.sequences.map((sequence) => <option key={sequence.id} value={sequence.id}>{sequence.name}</option>)}</select></label>
            <button type="button" className="admin-btn ghost" onClick={addSequence}>+ New sequence</button>
          </div>
          {selected ? <div className="dialogue-editor">
            <div className="admin-form">
              <label>Sequence name<input className="admin-input" value={selected.name} onChange={(event) => updateSequence(selected.id, { name: event.target.value })} /></label>
              <label>Trigger / when it plays<input className="admin-input" value={selected.trigger} onChange={(event) => updateSequence(selected.id, { trigger: event.target.value })} /></label>
              <label>Priority<select className="admin-input" value={selected.priority} onChange={(event) => updateSequence(selected.id, { priority: Number(event.target.value) as 0 | 1 | 2 })}><option value={0}>0 · Ambient (idle only)</option><option value={1}>1 · Interaction</option><option value={2}>2 · Critical / interrupt</option></select></label>
              <label className="dialogue-enable"><input type="checkbox" checked={selected.enabled} onChange={(event) => updateSequence(selected.id, { enabled: event.target.checked })} /> Enabled</label>
            </div>
            <h3>Lines in order</h3>
            {selected.lines.map((line, index) => <div className="dialogue-line-editor" key={index}>
              <div className="dialogue-line-heading"><b>Line {index + 1}</b><div><button type="button" className="admin-btn ghost" disabled={index === 0} onClick={() => updateSequence(selected.id, { lines: selected.lines.map((item, i, all) => i === index ? all[i - 1] : i === index - 1 ? all[i + 1] : item) })}>↑</button> <button type="button" className="admin-btn ghost" disabled={index === selected.lines.length - 1} onClick={() => updateSequence(selected.id, { lines: selected.lines.map((item, i, all) => i === index ? all[i + 1] : i === index + 1 ? all[i - 1] : item) })}>↓</button> <button type="button" className="admin-btn ghost" disabled={selected.lines.length === 1} onClick={() => updateSequence(selected.id, { lines: selected.lines.filter((_, i) => i !== index) })}>Remove line</button></div></div>
              <label>Dialogue text<textarea className="admin-input" rows={2} value={line.line} onChange={(event) => updateLine(selected.id, index, { line: event.target.value })} /></label>
              <div className="admin-form"><label>Expression<input className="admin-input" value={line.expression} onChange={(event) => updateLine(selected.id, index, { expression: event.target.value })} /></label><label>Delay after line (ms)<input className="admin-input" type="number" min={0} max={120000} value={line.delayMs ?? 0} onChange={(event) => updateLine(selected.id, index, { delayMs: Math.max(0, Math.min(120000, Number(event.target.value) || 0)) })} /></label></div>
            </div>)}
            <button type="button" className="admin-btn ghost" onClick={() => updateSequence(selected.id, { lines: [...selected.lines, { line: "", expression: "hmm" }] })}>+ Add line</button>
            <div className="dialogue-preview"><b>Preview</b><p lang="bn">{selected.lines[previewIndex]?.line ?? "No line selected"}</p><small>{selected.lines[previewIndex]?.expression ?? "—"} · line {Math.min(previewIndex + 1, selected.lines.length)} of {selected.lines.length}</small><div className="sticker-card-actions"><button type="button" className="admin-btn ghost" onClick={() => setPreviewIndex((index) => Math.max(0, index - 1))} disabled={previewIndex === 0}>Previous line</button><button type="button" className="admin-btn ghost" onClick={() => setPreviewIndex((index) => Math.min(selected.lines.length - 1, index + 1))} disabled={previewIndex >= selected.lines.length - 1}>Next line</button></div></div>
            <div className="sticker-card-actions"><button type="button" className="admin-btn ghost" onClick={() => { if (confirm("Delete this sequence from the draft?")) { setDialogueDraft((current) => ({ ...current, status: "draft", sequences: current.sequences.filter((sequence) => sequence.id !== selected.id) })); setSelectedSequence(dialogueDraft.sequences.find((sequence) => sequence.id !== selected.id)?.id ?? ""); } }} disabled={dialogueDraft.sequences.length <= 1}>Delete sequence</button><button type="button" className="admin-btn ghost" onClick={() => void saveDialogue("draft")}>Save draft</button><button type="button" className="admin-btn" onClick={() => void saveDialogue("published")}>Publish configuration</button></div>
          </div> : <p>No sequences yet. Add one to start editing.</p>}
          <p><small>Published sequences are used by the cart idle reactions and checkout payment / validation reactions. Drafts remain separate and never affect customers.</small></p>
        </section>
      ) : (
        <>
          <section className="admin-panel">
            <h2>Library overview</h2>
            <div className="admin-tiles">
              <div className="admin-tile"><span>Total assets</span><b>{entries.length}</b></div>
              <div className="admin-tile"><span>Active</span><b>{entries.filter((entry) => entry.status === "active").length}</b></div>
              <div className="admin-tile"><span>Inactive</span><b>{entries.filter((entry) => entry.status === "inactive").length}</b></div>
              <div className="admin-tile"><span>Hidden</span><b>{entries.filter((entry) => entry.status === "hidden").length}</b></div>
              <div className="admin-tile"><span>Custom uploads</span><b>{st.custom.length}</b></div>
            </div>
            <p><small>Permanent deletion is intentionally disabled here so referenced assets and stored uploads cannot be accidentally orphaned.</small></p>
          </section>

          <section className="admin-panel">
            <div className="sticker-library-tools">
              <label>Search stickers
                <input type="search" value={search} placeholder="Name, ID, tag…" onChange={(event) => setSearch(event.target.value)} />
              </label>
              <label>Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | StickerStatus)}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
              <label>Category
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="all">All categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <span><small>{filtered.length} of {entries.length} assets</small></span>
            </div>
            <div className="admin-grid">
              {filtered.map((entry) => {
                const references = referencesFor(entry);
                return (
                  <figure key={entry.id} className={entry.status === "hidden" ? "off sticker-card" : "sticker-card"}>
                    <div className="sticker-card-preview">
                      {entry.src
                        ? <img src={entry.src} alt={entry.label} onLoad={(event) => {
                            const image = event.currentTarget;
                            const value = `${image.naturalWidth} × ${image.naturalHeight}`;
                            setDimensions((current) => current[entry.id] === value ? current : { ...current, [entry.id]: value });
                          }} />
                        : <span className="sticker">{entry.label}</span>}
                    </div>
                    <figcaption>
                      <b>{entry.label}</b><br />
                      <small>{entry.id} · {entry.isBuiltIn ? "Built-in" : "Custom upload"}</small><br />
                      <span className={`sticker-status ${entry.status}`}>{entry.status}</span>
                      <small>Category: {entry.category}</small>
                      <small>Tags: {entry.tags.length ? entry.tags.join(", ") : "none"}</small>
                      {entry.src && <small>Dimensions: {dimensions[entry.id] ?? "loading…"}</small>}
                    </figcaption>
                    {!entry.isBuiltIn && (
                      <div>
                        <label><small>Category</small>
                          <input className="sticker-meta-input" defaultValue={entry.category} aria-label={`Category for ${entry.label}`} onBlur={(event) => {
                            const category = event.currentTarget.value.trim() || "custom";
                            if (category !== entry.category) void updateCustom(entry.id, { category });
                          }} />
                        </label>
                        <label><small>Tags (comma separated)</small>
                          <input className="sticker-meta-input" defaultValue={entry.tags.join(", ")} aria-label={`Tags for ${entry.label}`} onBlur={(event) => {
                            const tags = [...new Set(event.currentTarget.value.split(",").map((tag) => tag.trim()).filter(Boolean))];
                            if (tags.join(",") !== entry.tags.join(",")) void updateCustom(entry.id, { tags });
                          }} />
                        </label>
                      </div>
                    )}
                    <div className="sticker-usage">
                      <b>References</b><br />
                      {references.length ? references.map((reference) => <div key={reference}>{reference}</div>) : <div>No configured references detected.</div>}
                    </div>
                    <div className="sticker-card-actions">
                      <button type="button" className="admin-btn ghost" onClick={() => void setStatus(entry.id, entry.status === "hidden" ? "active" : "hidden")}>{entry.status === "hidden" ? "Unhide" : "Hide"}</button>
                      <button type="button" className="admin-btn ghost" onClick={() => void setStatus(entry.id, entry.status === "active" ? "inactive" : "active")}>{entry.status === "inactive" ? "Activate" : entry.status === "hidden" ? "Set active" : "Deactivate"}</button>
                    </div>
                  </figure>
                );
              })}
              {!filtered.length && <p>No stickers match these filters.</p>}
            </div>
          </section>

          <section className="admin-panel">
            <h2>Slide layouts</h2>
            <div className="admin-grid">
              {Object.entries(PRESETS).map(([key, preset]) => <figure key={key}><b>{preset.label}</b><p><small>{preset.note}</small></p></figure>)}
            </div>
          </section>
        </>
      )}
    </>
  );
}

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
      { line: "ভাই… আর কত ভাববেন?", expression: "unimpressed", delayMs: 0 },
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
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [dialogueStickerSearch, setDialogueStickerSearch] = useState("");
  const [stickerLibraryOpen, setStickerLibraryOpen] = useState(false);
  const [expandedDialogueLines, setExpandedDialogueLines] = useState<Record<number, boolean>>({});
  useEffect(() => {
    if (!site?.dialogue) return;
    const fallbackSequences: DialogueSequence[] = [
      { id: "grandpa-popup", name: "Visitor popup", trigger: "Visitor popup after 7 seconds", priority: 0, enabled: true, lines: [
        { line: "Cart ko dekha? It is feeling emotionally empty.", expression: "hmm", stickerId: "shop-character" },
        { line: "Tiny object, giant explanation. Excellent choice.", expression: "laugh", stickerId: "shop-character" },
      ] },
    ];
    const source = site.dialogue.draftSequences ?? site.dialogue.sequences;
    const sequences = [...source, ...fallbackSequences.filter((fallback) => !source.some((sequence) => sequence.id === fallback.id))]
      .map((sequence) => ({
        ...sequence,
        lines: sequence.lines.map((line) => ({
          ...line,
          stickerId: line.stickerId ?? "shop-character",
        })),
      }));
    const neededSpeakerMigration = source.some((sequence) => sequence.lines.some((line) => !line.stickerId));
    setDialogueDraft({
      ...site.dialogue,
      status: site.dialogue.draftSequences || neededSpeakerMigration ? "draft" : site.dialogue.status,
      sequences,
    });
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
  const allocatableStickers = entries.filter((entry) => Boolean(entry.src));
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
        <section className="sticker-workspace">
          <header className="sticker-workspace-head">
            <div><p className="sticker-eyebrow">SMOL STUUF / CONTROL ROOM</p><h2>Sticker System</h2><p>Choose a sticker, assign speakers line-by-line, and control exactly where and when each sequence runs.</p></div>
            <div className="sticker-workspace-actions"><span className={`sticker-status ${dialogueDraft.status === "published" ? "active" : "inactive"}`}>{dialogueDraft.status === "published" ? "Live configuration" : "Draft changes"}</span><button type="button" className="admin-btn ghost" onClick={() => void saveDialogue("draft")}>Save draft</button><button type="button" className="admin-btn sticker-publish" onClick={() => void saveDialogue("published")}>Publish changes</button></div>
          </header>
          <div className="sticker-library-float">
            <button type="button" className={`sticker-library-orb ${stickerLibraryOpen ? "open" : ""}`} aria-label={stickerLibraryOpen ? "Close sticker library" : "Open sticker library"} aria-expanded={stickerLibraryOpen} onClick={() => setStickerLibraryOpen((open) => !open)}><span className="sticker-library-orb-icon">{stickerLibraryOpen ? "×" : "▧"}</span><span>Library</span></button>
            {stickerLibraryOpen && <div className="sticker-library-popover">
              <div className="sticker-workspace-column sticker-picker-column">
                <div className="sticker-column-head"><div><h3>Sticker Library</h3><p>{allocatableStickers.length} available speakers</p></div><button type="button" className="admin-btn ghost" onClick={() => setTab("library")}>Manage</button></div>
                <label className="sticker-search">Find a sticker<input className="admin-input" value={dialogueStickerSearch} onChange={(event) => setDialogueStickerSearch(event.target.value)} placeholder="Search names or tags…" /></label>
                <p className="sticker-instruction">Choose a dialogue line first, then click a sticker to assign its speaker.</p>
                <div className="sticker-picker-grid">{allocatableStickers.filter((entry) => [entry.label, entry.id, ...entry.tags].join(" ").toLowerCase().includes(dialogueStickerSearch.toLowerCase())).map((entry) => { const assigned = selected?.lines[selectedLineIndex]?.stickerId === entry.id; return <button type="button" key={entry.id} className={`sticker-picker-card ${assigned ? "is-assigned" : ""}`} aria-pressed={assigned} onClick={() => selected && selectedLineIndex >= 0 && updateLine(selected.id, selectedLineIndex, { stickerId: entry.id })}><span className="sticker-picker-image"><img src={entry.src} alt="" loading="lazy" /></span><b>{entry.label}</b><small>{entry.isBuiltIn ? "Built-in" : "Custom upload"}</small>{assigned && <span className="sticker-assigned-mark">Assigned</span>}</button>; })}</div>
                <div className="sticker-unassign"><button type="button" className="admin-btn ghost" onClick={() => selected && selectedLineIndex >= 0 && updateLine(selected.id, selectedLineIndex, { stickerId: undefined })}>Clear speaker assignment</button></div>
              </div>
            </div>}
          </div>
          <div className="sticker-workspace-grid sticker-workspace-grid-merged">
            <div className="sticker-sequence-strip">
              <div className="sticker-column-head"><div><h3>2. Locations & sequences</h3><p>Choose which interaction to edit</p></div><button type="button" className="admin-btn ghost" onClick={addSequence}>+ New</button></div>
              <label className="sticker-search">Active sequence<select className="admin-input" value={selected?.id ?? ""} onChange={(event) => { setSelectedSequence(event.target.value); setPreviewIndex(0); setSelectedLineIndex(0); setExpandedDialogueLines({}); }}>{dialogueDraft.sequences.map((sequence) => <option key={sequence.id} value={sequence.id}>{sequence.name}</option>)}</select></label>
              <div className="sticker-sequence-list">
                {dialogueDraft.sequences.map((sequence) => <button type="button" key={sequence.id} className={`sticker-sequence-card ${sequence.id === selected?.id ? "selected" : ""}`} onClick={() => { setSelectedSequence(sequence.id); setPreviewIndex(0); setSelectedLineIndex(0); setExpandedDialogueLines({}); }}>
                  <span className="sticker-sequence-icon">{sequence.id.startsWith("cart") ? "🛒" : sequence.id.startsWith("checkout") ? "✓" : "✳"}</span><span className="sticker-sequence-info"><b>{sequence.name}</b><small>{sequence.trigger}</small><small>{sequence.lines.length} dialogue lines · priority {sequence.priority}</small></span><span className={`sticker-mini-status ${sequence.enabled ? "on" : ""}`}>{sequence.enabled ? "Enabled" : "Off"}</span>
                </button>)}
              </div>
              <div className="sticker-location-note"><b>Website locations</b><p>Cart · Checkout · Visitor popup</p><small>Trigger text describes the intended event; runtime behaviour depends on the supported location.</small></div>
              <div className="sticker-sequence-summary"><span>Sequences</span><b>{dialogueDraft.sequences.length}</b><span>Enabled</span><b>{dialogueDraft.sequences.filter((sequence) => sequence.enabled).length}</b><span>Lines</span><b>{dialogueDraft.sequences.reduce((total, sequence) => total + sequence.lines.length, 0)}</b></div>
            </div>
            <section className="sticker-workspace-column sticker-detail-column sticker-detail-merged">
              {selected ? <>
                <div className="sticker-column-head"><div><p className="sticker-eyebrow">3. SEQUENCE EDITOR</p><h3>Dialogue & timing</h3><p>Every line has its own speaker sticker and display timing.</p></div><span className={`sticker-status ${selected.enabled ? "active" : "inactive"}`}>{selected.enabled ? "Enabled" : "Disabled"}</span></div>
                <div className="sticker-sequence-settings">
                  <label>Sequence name<input className="admin-input" value={selected.name} onChange={(event) => updateSequence(selected.id, { name: event.target.value })} /></label>
                  <label>When does it play?<input className="admin-input" value={selected.trigger} onChange={(event) => updateSequence(selected.id, { trigger: event.target.value })} /><small>Describe the event that should start this dialogue.</small></label>
                  <div className="sticker-settings-row"><label>Priority<select className="admin-input" value={selected.priority} onChange={(event) => updateSequence(selected.id, { priority: Number(event.target.value) as 0 | 1 | 2 })}><option value={0}>Ambient / idle</option><option value={1}>Interaction</option><option value={2}>Critical / interrupt</option></select></label><label className="dialogue-enable"><input type="checkbox" checked={selected.enabled} onChange={(event) => updateSequence(selected.id, { enabled: event.target.checked })} /> Sequence enabled</label></div>
                </div>
                <div className="sticker-lines-heading"><div><h4>Dialogue lines</h4><p>Click a line to select it, then choose its speaker from the library.</p></div><button type="button" className="admin-btn ghost" onClick={() => { const index = selected.lines.length; updateSequence(selected.id, { lines: [...selected.lines, { line: "", expression: "hmm" }] }); setSelectedLineIndex(index); setPreviewIndex(index); }}>+ Add line</button></div>
                <div className="sticker-dialogue-lines">
                  {selected.lines.map((line, index) => {
                    const speakerSticker = allocatableStickers.find((entry) => entry.id === line.stickerId);
                    return <article key={index} className={`sticker-dialogue-line ${selectedLineIndex === index ? "selected" : ""}`}>
                      <button type="button" className="sticker-line-select" onClick={() => { setSelectedLineIndex(index); setPreviewIndex(index); setExpandedDialogueLines((current) => ({ ...current, [index]: !(current[index] ?? index === selectedLineIndex) })); }} aria-expanded={expandedDialogueLines[index] ?? index === selectedLineIndex} aria-pressed={selectedLineIndex === index}>
                        <span className="sticker-line-number">{index + 1}</span><span className="sticker-line-thumb">{speakerSticker?.src ? <img src={speakerSticker.src} alt="" /> : <span>?</span>}</span><span className="sticker-line-identity"><b>{speakerSticker?.label ?? "No sticker assigned"}</b><small>{speakerSticker ? "Speaker assigned" : "Choose a speaker from library"}</small></span><span className="sticker-line-select-indicator">{selectedLineIndex === index ? "Editing" : "Edit"}</span>
                      </button>
                      {(expandedDialogueLines[index] ?? index === selectedLineIndex) && <div className="sticker-line-edit-fields">
                        <label>Dialogue text<textarea className="admin-input" rows={2} value={line.line} onFocus={() => { setSelectedLineIndex(index); setPreviewIndex(index); }} onChange={(event) => updateLine(selected.id, index, { line: event.target.value })} placeholder="Write the dialogue spoken by this sticker…" /></label>
                        <div className="sticker-settings-row"><label>Expression<input className="admin-input" value={line.expression} onFocus={() => setSelectedLineIndex(index)} onChange={(event) => updateLine(selected.id, index, { expression: event.target.value })} /></label><label>Extra pause (seconds)<input className="admin-input" type="number" min={0} max={120} step={0.5} value={(line.delayMs ?? 0) / 1000} onFocus={() => setSelectedLineIndex(index)} onChange={(event) => updateLine(selected.id, index, { delayMs: Math.max(0, Math.min(120000, (Number(event.target.value) || 0) * 1000)) })} /></label></div>
                        <label>Speaker sticker<select className="admin-input" value={line.stickerId ?? ""} onFocus={() => setSelectedLineIndex(index)} onChange={(event) => updateLine(selected.id, index, { stickerId: event.target.value || undefined })}><option value="">Use default speaker</option>{allocatableStickers.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
                        <div className="sticker-line-actions"><button type="button" className="admin-btn ghost" disabled={index === 0} onClick={() => { const lines = [...selected.lines]; [lines[index - 1], lines[index]] = [lines[index], lines[index - 1]]; updateSequence(selected.id, { lines }); setSelectedLineIndex(index - 1); setPreviewIndex(index - 1); }}>↑ Move up</button><button type="button" className="admin-btn ghost" disabled={index === selected.lines.length - 1} onClick={() => { const lines = [...selected.lines]; [lines[index + 1], lines[index]] = [lines[index], lines[index + 1]]; updateSequence(selected.id, { lines }); setSelectedLineIndex(index + 1); setPreviewIndex(index + 1); }}>↓ Move down</button><button type="button" className="admin-btn ghost" disabled={selected.lines.length <= 1} onClick={() => { updateSequence(selected.id, { lines: selected.lines.filter((_, i) => i !== index) }); setSelectedLineIndex(Math.max(0, Math.min(index, selected.lines.length - 2))); setPreviewIndex(Math.max(0, Math.min(index, selected.lines.length - 2))); }}>Remove</button></div>
                      </div>}
                    </article>;
                  })}
                </div>
                <div className="sticker-live-preview"><div className="sticker-preview-header"><b>Live preview</b><span>Line {Math.min(previewIndex + 1, selected.lines.length)} of {selected.lines.length}</span></div><div className="sticker-preview-stage">{allocatableStickers.find((entry) => entry.id === selected.lines[previewIndex]?.stickerId)?.src ? <img src={allocatableStickers.find((entry) => entry.id === selected.lines[previewIndex]?.stickerId)?.src} alt="" /> : <div className="sticker-preview-placeholder">Choose a speaker sticker</div>}<div className="sticker-preview-bubble">{selected.lines[previewIndex]?.line || "Your dialogue will appear here…"}</div></div><div className="sticker-preview-timing"><span>Reading time <b>12–16s</b></span><span>Extra pause <b>{((selected.lines[previewIndex]?.delayMs ?? 0) / 1000).toFixed(1)}s</b></span></div></div>
                <div className="sticker-detail-footer"><button type="button" className="admin-btn ghost" onClick={() => { if (confirm("Delete this sequence from the draft?")) { const remaining = dialogueDraft.sequences.filter((sequence) => sequence.id !== selected.id); setDialogueDraft((current) => ({ ...current, status: "draft", sequences: remaining })); setSelectedSequence(remaining[0]?.id ?? ""); setSelectedLineIndex(0); setPreviewIndex(0); } }} disabled={dialogueDraft.sequences.length <= 1}>Delete sequence</button><span>Draft changes are not live until published.</span></div>
              </> : <p>No sequences yet. Create one to start editing.</p>}
            </section>
          </div>
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

import { useState } from "react";
import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PRESETS, STICKERS } from "@/data/drops";
import { adminSaveSetting } from "@/lib/admin.functions";
import { useSite, type StickerSettings, type CustomSticker } from "@/lib/site";
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
  if (!site) return <p>Loading…</p>;
  const st = site.stickers;

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
          <h2>Sticker Controls</h2>
          <p>Dialogue editing and sequence controls are not connected yet. This section is reserved for the next phase; existing customer dialogue and timing remain unchanged.</p>
          <p><small>Current shared dialogue timing and priorities are preserved.</small></p>
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
                      <button type="button" className="admin-btn ghost" onClick={() => void setStatus(entry.id, entry.status === "active" ? "inactive" : "active")}>{entry.status === "inactive" ? "Activate" : "Deactivate"}</button>
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

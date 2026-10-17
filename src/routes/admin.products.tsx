import { pageHead } from "@/lib/page-head";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminDeleteProduct, adminDeleteVariation, adminListCatalog, adminSaveProduct, adminSaveVariation } from "@/lib/admin.functions";
import { AdminUpload } from "@/components/smol/AdminUpload";
import { ProductImage } from "@/components/smol/ProductImage";
import { useAdminToken } from "@/lib/admin-session";
import { PacmanConfigurator } from "@/components/smol/PacmanConfigurator";
import { pacmanConfigSchema, type PacmanConfig } from "@/lib/pacman-config";

export const Route = createFileRoute("/admin/products")({ head: () => pageHead("Catalog", "SMOL STUUF catalog administration."), component: Products });

type Row = Awaited<ReturnType<typeof adminListCatalog>>["products"][number];
const BLANK = { num: "", name: "", price: 0, stock: 0, tag: "NEW", color: "#FFD23F", material: "", dims: "", batch: "Batch 04", description: "", image_key: "", is_hidden: false, requires_advance_payment: false };

function Products() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ["admin", "catalog", token], enabled: Boolean(token), retry: false, queryFn: () => adminListCatalog({ data: { token } }) });
  const [open, setOpen] = useState<number | "new" | null>(null);

  const run = async (p: Promise<unknown>, msg = "Saved") => {
    try { await p; toast.success(msg); await qc.invalidateQueries({ queryKey: ["admin"] }); return true; }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); return false; }
  };

  return (
    <>
      <div className="admin-row"><h1 className="admin-h1">Catalog</h1>
        <button className="admin-btn" onClick={() => setOpen("new")}>+ Add product</button></div>
      {isLoading && <p>Loading products…</p>}
      {error && <p className="admin-error">Couldn't load products: {error.message}</p>}
      {open === "new" && <Editor token={token} p={BLANK} onSave={async (p) => { if (await run(adminSaveProduct({ data: { token, product: p } }), "Product added")) setOpen(null); }} onCancel={() => setOpen(null)} />}
      <table className="admin-table">
        <thead><tr><th /><th>#</th><th>Product</th><th>Price</th><th>Stock</th><th>Where</th><th /></tr></thead>
        <tbody>
          {(data?.products ?? []).map((p) => (
            <ProductRows key={p.id} p={p} token={token} open={open === p.id} toggle={() => setOpen(open === p.id ? null : p.id)} run={run} />
          ))}
        </tbody>
      </table>
      {data && !data.products.length && <p className="admin-panel">No products yet — add your first one.</p>}
    </>
  );
}

function ProductRows({ p, token, open, toggle, run }: { p: Row; token: string; open: boolean; toggle: () => void; run: (p: Promise<unknown>, m?: string) => Promise<boolean> }) {
  const vars = [...p.product_variations].filter((v) => v.is_active).sort((a, b) => a.display_order - b.display_order);
  return (
    <>
      <tr>
        <td><ProductImageThumb id={p.id} name={p.name} src={p.image_key} /></td>
        <td>{p.num}</td><td><b>{p.name}</b>{vars.length > 0 && <small> · {vars.length} options</small>}</td>
        <td>৳{Number(p.price)}</td><td>{p.stock}</td><td>{p.is_hidden ? "Secret vault" : "Shop"}</td>
        <td style={{ whiteSpace: "nowrap" }}>
          <button className="admin-btn ghost" onClick={toggle}>{open ? "Close" : "Edit"}</button>
          <button className="admin-btn danger" onClick={() => confirm(`Delete "${p.name}"? This can't be undone.`) && run(adminDeleteProduct({ data: { token, id: p.id } }), "Deleted")}>Delete</button>
        </td>
      </tr>
      {open && (
        <tr className="admin-sub"><td colSpan={7}>
          <Editor token={token} p={p} onSave={(np) => run(adminSaveProduct({ data: { token, product: { ...np, id: p.id } } }))} />
          <h3><b>Options</b> <small>(sizes, packs — each with its own price & stock)</small></h3>
          {vars.map((v) => <VariationRow key={v.id} token={token} v={v} run={run} />)}
          <VariationRow token={token} v={{ product_id: p.id, name: "", price: Number(p.price), stock: 0, display_order: vars.length }} run={run} />
        </td></tr>
      )}
    </>
  );
}

function ProductImageThumb(props: { id: number; name: string; src: string }) {
  return <span className="admin-thumb" style={{ display: "inline-block", overflow: "hidden" }}><ProductImage {...props} /></span>;
}

function Editor({ token, p, onSave, onCancel }: { token: string; p: typeof BLANK; onSave: (p: typeof BLANK) => void; onCancel?: () => void }) {
  const [f, setF] = useState({ ...BLANK, ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, (p as Record<string, unknown>)[k] ?? (BLANK as Record<string, unknown>)[k]])) } as typeof BLANK);
  const set = <K extends keyof typeof BLANK>(k: K, v: (typeof BLANK)[K]) => setF((x) => ({ ...x, [k]: v }));
  const text = (k: "num" | "name" | "tag" | "material" | "dims" | "batch", label: string) => (
    <label>{label}<input className="admin-input" value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
  );
  return (
    <form className="admin-panel" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
      <div className="admin-form">
        {text("name", "Name")}{text("num", "Number (e.g. 07)")}
        <label>Price (৳)<input className="admin-input" type="number" min={0} value={f.price} onChange={(e) => set("price", Number(e.target.value))} /></label>
        <label>Stock<input className="admin-input" type="number" min={0} value={f.stock} onChange={(e) => set("stock", Number(e.target.value))} /></label>
        {text("tag", "Tag")}{text("batch", "Batch")}{text("material", "Material")}{text("dims", "Size")}
        <label>Card colour<input type="color" value={f.color} onChange={(e) => set("color", e.target.value)} /></label>
        <label className="wide">Description<textarea className="admin-input" value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
        <label className="wide">Photo
          <span className="admin-row">
            {f.image_key.startsWith("http") && <img className="admin-thumb" src={f.image_key} alt="" />}
            <AdminUpload token={token} accept="image/*" label="Upload photo" onDone={(url) => set("image_key", url)} />
            {f.image_key && <button type="button" className="admin-btn ghost" onClick={() => set("image_key", "")}>Remove photo</button>}
          </span>
        </label>
        <label><span><input type="checkbox" checked={f.is_hidden} onChange={(e) => set("is_hidden", e.target.checked)} /> Secret vault only</span></label>
        <label><span><input type="checkbox" checked={f.requires_advance_payment} onChange={(e) => set("requires_advance_payment", e.target.checked)} /> Needs bKash advance</span></label>
      </div>
      <button className="admin-btn">Save product</button>
      {onCancel && <button type="button" className="admin-btn ghost" onClick={onCancel}>Cancel</button>}
    </form>
  );
}

type V = { id?: string | undefined; product_id: number; name: string; price: number; stock: number; display_order: number; button_config?: unknown };
function VariationRow({ token, v, run }: { token: string; v: V; run: (p: Promise<unknown>, m?: string) => Promise<boolean> }) {
  const [f, setF] = useState({ ...v, price: Number(v.price) });
  const [config, setConfig] = useState<PacmanConfig>(() => {
    const parsed = pacmanConfigSchema.safeParse(v.button_config);
    return parsed.success ? parsed.data : {};
  });
  return (
    <form className="variation-editor" onSubmit={async (e) => { e.preventDefault(); if (await run(adminSaveVariation({ data: { token, v: { id: v.id, product_id: v.product_id, name: f.name, price: f.price, stock: f.stock, display_order: f.display_order, button_config: config } } })) && !v.id) setF({ ...v, price: Number(v.price) }); }}>
      <div className="admin-row">
      <input className="admin-input" placeholder={v.id ? "" : "New option name"} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      ৳<input className="admin-input num" type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} />
      Stock <input className="admin-input num" type="number" min={0} value={f.stock} onChange={(e) => setF({ ...f, stock: Number(e.target.value) })} />
      <button className="admin-btn">{v.id ? "Save" : "+ Add option"}</button>
      {v.id && <button type="button" className="admin-btn danger" onClick={() => { if (v.id && confirm(`Remove option "${v.name}"?`)) void run(adminDeleteVariation({ data: { token, id: v.id } }), "Removed"); }}>Remove</button>}
      </div>
      <PacmanConfigurator value={config} onChange={setConfig} name={f.name} />
    </form>
  );
}

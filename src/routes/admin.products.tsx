import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminListProducts, adminUpdateProduct, adminUpdateVariation } from "@/lib/admin.functions";
import { useAdminToken } from "./admin";

export const Route = createFileRoute("/admin/products")({ component: Products });

function Products() {
  const token = useAdminToken();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "products"], queryFn: () => adminListProducts({ data: { token } }) });

  const run = async (p: Promise<unknown>) => {
    try { await p; toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const numField = (value: number, save: (n: number) => Promise<unknown>) => (
    <input className="admin-input num" type="number" min={0} defaultValue={value}
      onBlur={(e) => { const n = Number(e.target.value); if (n !== value) run(save(n)); }} />
  );

  return (
    <>
      <h1 className="admin-h1">Catalog</h1>
      <table className="admin-table">
        <thead><tr><th>#</th><th>Product</th><th>Price</th><th>Stock</th><th>Vault</th></tr></thead>
        <tbody>
          {(data?.products ?? []).map((p) => (
            <Fragment key={p.id}>
              <tr key={p.id}>
                <td>{p.num}</td><td><b>{p.name}</b></td>
                <td>{numField(Number(p.price), (price) => adminUpdateProduct({ data: { token, id: p.id, price } }))}</td>
                <td>{numField(p.stock, (stock) => adminUpdateProduct({ data: { token, id: p.id, stock } }))}</td>
                <td><input type="checkbox" checked={p.is_hidden} onChange={(e) => run(adminUpdateProduct({ data: { token, id: p.id, is_hidden: e.target.checked } }))} /></td>
              </tr>
              {[...p.product_variations].sort((a, b) => a.display_order - b.display_order).map((v) => (
                <tr key={v.id} className="admin-sub">
                  <td /><td>↳ {v.name}</td>
                  <td>{numField(Number(v.price), (price) => adminUpdateVariation({ data: { token, id: v.id, price } }))}</td>
                  <td>{numField(v.stock, (stock) => adminUpdateVariation({ data: { token, id: v.id, stock } }))}</td>
                  <td />
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}

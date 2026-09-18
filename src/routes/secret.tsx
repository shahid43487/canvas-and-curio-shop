import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { ProductCard } from "@/components/smol/ProductCard";
import { SecretGate, SECRET_ACCESS_KEY } from "@/components/smol/SecretGate";
import { listSecretProducts } from "@/lib/products.functions";
import type { Product } from "@/data/products";

export const Route = createFileRoute("/secret")({
  head: () => ({ meta: [
    { title: "Secret prank store — SMOL STUUF" },
    { name: "description", content: "Hidden small-batch prank objects from SMOL STUUF." },
    { property: "og:title", content: "Secret prank store — SMOL STUUF" },
    { property: "og:description", content: "Hidden small-batch prank objects from SMOL STUUF." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: SecretStore,
});

function SecretStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    listSecretProducts({ data: { access: window.sessionStorage.getItem(SECRET_ACCESS_KEY) ?? "" } })
      .then((result) => setProducts(result.products))
      .catch(() => setError("The prank shelf is hiding. Try the secret door again."));
  }, []);

  return <SecretGate><SiteHeader /><main className="secret-store">
    <header className="wrap secret-store-head"><span>ABSOLUTELY NOT A SHOP</span><h1>The secret prank shelf</h1><p>Small objects for harmless confusion. Advance bKash only; every transfer is checked before confirmation.</p></header>
    <section className="wrap secret-products" aria-label="Secret prank products">
      {error && <p className="secret-error">{error}</p>}
      {!error && products.length === 0 && <p className="secret-loading">Dusting off the suspicious shelf…</p>}
      <div className="grid">{products.map((product) => <ProductCard key={product.id} product={product} secret />)}</div>
    </section>
  </main><SiteFooter /></SecretGate>;
}
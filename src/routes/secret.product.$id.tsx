import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { ProductImage } from "@/components/smol/ProductImage";
import { SecretGate, SECRET_ACCESS_KEY } from "@/components/smol/SecretGate";
import { formatPrice, type Product } from "@/data/products";
import { useCart } from "@/hooks/use-cart";
import { getSecretProduct } from "@/lib/products.functions";

export const Route = createFileRoute("/secret/product/$id")({
  head: () => ({ meta: [
    { title: "Secret product — SMOL STUUF" },
    { name: "description", content: "A hidden SMOL STUUF prank object." },
    { property: "og:title", content: "Secret product — SMOL STUUF" },
    { property: "og:description", content: "A hidden SMOL STUUF prank object." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex, nofollow" },
  ] }), component: SecretProduct,
});

function SecretProduct() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const { addItem, setIsOpen } = useCart();
  useEffect(() => {
    const access = window.sessionStorage.getItem(SECRET_ACCESS_KEY) ?? "";
    if (access !== "open") return;
    getSecretProduct({ data: { id, access } })
      .then((result) => setProduct(result.product))
      .catch(() => setError("This prank has escaped."));
  }, [id]);
  return <SecretGate><SiteHeader secret /><main><div className="wrap product-view">
    <Link to="/secret" className="back-link">← Back to the secret shelf</Link>
    {error && <p className="secret-error">{error}</p>}
    {!product && !error && <p className="secret-loading">Finding the prank…</p>}
    {product && <div className="product-layout"><div className="product-photo"><span className="num-badge">{product.num}</span><ProductImage id={product.id} name={product.name} eager /></div><div className="product-info"><span className="card-tag dark">ADVANCE ONLY</span><h1>{product.name}</h1><div className="price-row"><span className="price">{formatPrice(product.price)}</span></div><p className="desc">{product.description}</p><div className="spec-table"><div className="spec-row"><span className="k">Material</span><span>{product.material}</span></div><div className="spec-row"><span className="k">Batch</span><span>{product.batch}</span></div><div className="spec-row"><span className="k">Stock</span><span>{product.stock} left</span></div></div><button className="add-cart button-spring" type="button" disabled={product.stock <= 0} onClick={() => { addItem(product); setIsOpen(true); }}>Add secret stuuf — {formatPrice(product.price)}</button><p className="edition-note">Adding this clears regular items from your basta. Secret orders require advance bKash verification.</p></div></div>}
  </div></main><SiteFooter /></SecretGate>;
}
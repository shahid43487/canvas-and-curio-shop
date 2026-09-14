import { Link } from "@tanstack/react-router";
import type { Product } from "@/data/products";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const dark = product.tag === "LIMITED" || product.tag === "WEIRD ONE";
  return (
    <Link to="/product/$id" params={{ id: String(product.id) }} className="card">
      <span className={dark ? "card-tag dark" : "card-tag"}>{product.tag}</span>
      <div className="swatch">
        <span className="num">{product.num}</span>
        <ProductImage id={product.id} name={product.name} />
        <span className="card-sticker" aria-hidden="true">✦</span>
      </div>
      <h3>{product.name}</h3>
      <div className="meta">
        <span>{product.material.split(",")[0]}</span>
        <span className="price">{product.price}</span>
      </div>
    </Link>
  );
}

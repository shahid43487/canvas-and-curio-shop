import { Link } from "@tanstack/react-router";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useCart } from "@/hooks/use-cart";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product, secret = false }: { product: Product; secret?: boolean }) {
  const { addItem, setIsOpen } = useCart();
  const dark = product.tag === "LIMITED" || product.tag === "WEIRD ONE";

  const handleAdd = () => {
    addItem(product);
    setIsOpen(true);
  };

  return (
    <div className="card">
      {secret ? <Link
        to="/secret/product/$id"
        params={{ id: String(product.id) }}
        className="card-link"
        aria-label={`View ${product.name}`}
      >
        <span className={dark ? "card-tag dark" : "card-tag"}>{product.tag}</span>
        <div className="swatch">
          <span className="num">{product.num}</span>
          <ProductImage id={product.id} name={product.name} />
          <span className="card-sticker" aria-hidden="true">✦</span>
        </div>
        <h3>{product.name}</h3>
        <div className="meta"><span>{product.material.split(",")[0]}</span><span className="price">{formatPrice(product.price)}</span></div>
      </Link> : <Link
        to="/product/$id"
        params={{ id: String(product.id) }}
        className="card-link"
        aria-label={`View ${product.name}`}
      >
        <span className={dark ? "card-tag dark" : "card-tag"}>{product.tag}</span>
        <div className="swatch">
          <span className="num">{product.num}</span>
          <ProductImage id={product.id} name={product.name} />
          <span className="card-sticker" aria-hidden="true">
            ✦
          </span>
        </div>
        <h3>{product.name}</h3>
        <div className="meta">
          <span>{product.material.split(",")[0]}</span>
          <span className="price">{formatPrice(product.price)}</span>
        </div>
      </Link>}
      <button type="button" className="card-add button-spring" onClick={handleAdd}>
        Add · {formatPrice(product.price)}
      </button>
    </div>
  );
}

import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";

import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { ProductImage } from "@/components/smol/ProductImage";
import { StickerField } from "@/components/smol/StickerField";
import { formatPrice } from "@/data/products";
import { useCart } from "@/hooks/use-cart";
import { getProduct } from "@/lib/products.functions";

const productQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: { id } }),
  });

export const Route = createFileRoute("/product/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(productQueryOptions(params.id)),
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — SMOL STUUF` : "SMOL STUUF";
    const description = p ? `${p.description} ${p.batch}.` : "Small-batch objects from SMOL STUUF.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(productQueryOptions(id));
  const { product: p } = data;
  const { addItem, setIsOpen } = useCart();
  const [qty, setQty] = useState(1);

  if (!p) throw notFound();

  const outOfStock = p.stock <= 0;

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap product-view">
          <Link to="/shop" className="back-link">
            ← Back to shop
          </Link>
          <div className="product-layout">
            <div className="product-photo">
              <span className="num-badge">{p.num}</span>
              <ProductImage id={p.id} name={p.name} eager />
              <StickerField compact />
            </div>
            <div className="product-info">
              <h1>{p.name}</h1>
              <div className="price-row">
                <span className="price">{formatPrice(p.price)}</span>
                <span className="card-tag">{p.tag}</span>
              </div>
              <p className="desc">{p.description}</p>
              <div className="spec-table">
                <div className="spec-row">
                  <span className="k">Material</span>
                  <span>{p.material}</span>
                </div>
                <div className="spec-row">
                  <span className="k">Dimensions</span>
                  <span>{p.dims}</span>
                </div>
                <div className="spec-row">
                  <span className="k">Batch</span>
                  <span>{p.batch}</span>
                </div>
                <div className="spec-row">
                  <span className="k">Number</span>
                  <span>{p.num}</span>
                </div>
                <div className="spec-row">
                  <span className="k">Stock</span>
                  <span>{outOfStock ? "Sold out" : `${p.stock} left`}</span>
                </div>
              </div>
              <div className="colorways">
                {p.colors.map((c) => (
                  <span key={c} className="dotc" style={{ background: c }} />
                ))}
              </div>

              <div className="qty-row">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="qty-value">{qty}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                className="add-cart button-spring"
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  addItem(p, qty);
                  setIsOpen(true);
                }}
              >
                {outOfStock ? "Sold out" : `Add to cart — ${formatPrice(p.price * qty)}`}
              </button>
              <p className="edition-note">Small batch. Once it's gone, it's gone until the next drop.</p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

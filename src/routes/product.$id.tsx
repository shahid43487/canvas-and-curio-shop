import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";

import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { ProductImage } from "@/components/smol/ProductImage";
import { StickerField } from "@/components/smol/StickerField";
import { ProductCard } from "@/components/smol/ProductCard";
import { GrandpaPopup } from "@/components/smol/GrandpaPopup";
import { VariationSelector } from "@/components/smol/VariationSelector";
import type { Variation } from "@/data/products";
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
  const variations = (data.variations ?? []) as unknown as Variation[];
  const mode = variations.length ? (p?.selector_mode ?? "none") : "none";
  const [selectedId, setSelectedId] = useState(
    () => variations.find((v) => v.stock > 0)?.id,
  );

  if (!p) throw notFound();

  const selected = mode !== "none" ? variations.find((v) => v.id === selectedId) : undefined;
  const price = selected ? Number(selected.price) : p.price;
  const stock = selected ? selected.stock : p.stock;
  const outOfStock = stock <= 0;

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
              <ProductImage id={p.id} src={p.image_key} name={p.name} eager />
              <StickerField compact />
            </div>
            <div className="product-info">
              <h1>{p.name}</h1>
              <div className="price-row">
                <span className="price">{formatPrice(price)}</span>
                {selected?.compare_at_price ? <s className="compare-price">{formatPrice(Number(selected.compare_at_price))}</s> : null}
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
                  <span>{outOfStock ? "Sold out" : `${stock} left`}</span>
                </div>
              </div>
              {mode === "none" ? (
                <div className="colorways">
                  {p.colors.map((c) => (
                    <span key={c} className="dotc" style={{ background: c }} />
                  ))}
                </div>
              ) : (
                <VariationSelector mode={mode} variations={variations} selectedId={selectedId} onSelect={setSelectedId} />
              )}

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
                  addItem(p, qty, selected ? { id: selected.id, name: selected.name, price } : undefined);
                  setIsOpen(true);
                }}
              >
                {outOfStock ? "Sold out" : `Add to cart — ${formatPrice(price * qty)}`}
              </button>
              <p className="edition-note">Small batch. Once it's gone, it's gone until the next drop.</p>
            </div>
          </div>
          <section className="related-products" aria-labelledby="related-title">
            <div className="section-head">
              <h2 id="related-title">More smol suspects</h2>
              <p>Same tiny energy, different corner of the room.</p>
            </div>
            <div className="related-grid">
              {data.recommendations.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      <GrandpaPopup />
    </>
  );
}

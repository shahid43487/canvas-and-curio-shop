import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { ProductImage } from "@/components/smol/ProductImage";
import { StickerField } from "@/components/smol/StickerField";
import { PRODUCTS } from "@/data/products";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = PRODUCTS.find((p) => String(p.id) === params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — SMOL STUUF` : "SMOL STUUF";
    const description = p ? `${p.desc} ${p.batch}.` : "Small-batch objects from SMOL STUUF.";
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
  const { product: p } = Route.useLoaderData();

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
                <span className="price">{p.price}</span>
                <span className="card-tag">{p.tag}</span>
              </div>
              <p className="desc">{p.desc}</p>
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
              </div>
              <div className="colorways">
                {p.colors.map((c) => (
                  <span key={c} className="dotc" style={{ background: c }} />
                ))}
              </div>
              <button className="add-cart button-spring" type="button">
                Add to cart — {p.price}
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

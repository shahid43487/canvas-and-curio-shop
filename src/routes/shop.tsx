import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { ProductCard } from "@/components/smol/ProductCard";
import { PRODUCTS } from "@/data/products";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop all stuuf — SMOL STUUF" },
      {
        name: "description",
        content: "Every current SMOL STUUF piece: blob lamps, cork trays, hooks and bookends. Numbered, in stock, USD.",
      },
      { property: "og:title", content: "Shop all stuuf — SMOL STUUF" },
      { property: "og:description", content: "Numbered small-batch objects, in stock now. Prices in USD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap">
          <div className="section-head" style={{ paddingTop: 40 }}>
            <h2>Shop all stuuf</h2>
            <p>Every current piece, numbered and in stock. Prices in USD.</p>
          </div>
          <div className="grid" style={{ marginBottom: 40 }}>
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

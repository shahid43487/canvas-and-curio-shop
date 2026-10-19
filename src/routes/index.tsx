import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";

import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { ProductCard } from "@/components/smol/ProductCard";
import { ManifestoPanel } from "@/components/smol/ManifestoPanel";
import { DropsHero } from "@/components/smol/DropsHero";
import { listProducts } from "@/lib/products.functions";

const productsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SMOL STUUF — Smol things. Big mood." },
      {
        name: "description",
        content:
          "Small-batch objects made a little weird on purpose: 3D-printed lamps, cork trays and numbered desk stuuf from Batch 04.",
      },
      { property: "og:title", content: "SMOL STUUF — Smol things. Big mood." },
      {
        property: "og:description",
        content: "Small-batch, hand-finished objects in numbered editions. Batch 04 is live.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(productsQueryOptions);
  const featured = data.products.slice(0, 3);
  return (
    <>
      <SiteHeader />
      <main>
        <div className="hero dots">
          <div className="wrap hero-inner">
            <DropsHero />
          </div>
        </div>

        <div className="marquee">
          <span>
            SMOL THINGS. BIG MOOD. — GOOD STUUF. — NEW STUUF. — SMOL DROP. — WHY NOT? — MAKE ROOM FOR STUUF. — SMOL
            THINGS. BIG MOOD. — GOOD STUUF. — NEW STUUF. — SMOL DROP. — WHY NOT? — MAKE ROOM FOR STUUF. —
          </span>
        </div>

        <div className="wrap">
          <div className="section-head">
            <h2>Featured stuuf</h2>
            <p>Three fresh pieces from Batch 04. Limited runs, numbered, gone when they&apos;re gone.</p>
          </div>
        </div>
        <div className="wrap" style={{ paddingBottom: 20 }}>
          <div className="grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
        <ManifestoPanel />
      </main>
      <SiteFooter />
    </>
  );
}

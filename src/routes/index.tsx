import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";
import { ProductCard } from "@/components/smol/ProductCard";
import { PRODUCTS } from "@/data/products";
import logo from "@/assets/smol-stuuf-logo.png.asset.json";

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
  component: Home,
});

function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="hero dots">
          <div className="wrap hero-inner">
            <div>
              <span className="sticker s1">GOOD STUUF ✓</span>
              <div className="eyebrow-tag">
                <span className="dot" /> NEW DROP · BATCH 04 LIVE
              </div>
              <h1 className="hero-title">
                SMOL THINGS.
                <br />
                <span className="accent">BIG MOOD.</span>
              </h1>
              <p className="hero-sub">
                Small-batch objects, made a little weird on purpose. 3D-printed, cork-cut, and hand-finished — never
                generic, never precious.
              </p>
              <div className="hero-ctas">
                <Link to="/shop" className="btn-primary">
                  Shop the drop
                </Link>
                <Link to="/about" className="btn-outline">
                  Why so smol?
                </Link>
              </div>
            </div>
            <div className="hero-logo-art">
              <img src={logo.url} alt="SMOL STUUF hand-drawn logo" />
              <span className="sticker red s2">DROP 04</span>
            </div>
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
            <p>Four fresh pieces from Batch 04. Limited runs, numbered, gone when they're gone.</p>
          </div>
        </div>
        <div className="wrap" style={{ paddingBottom: 20 }}>
          <div className="grid">
            {PRODUCTS.slice(0, 3).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

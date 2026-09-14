import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/smol/SiteHeader";
import { SiteFooter } from "@/components/smol/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SMOL STUUF" },
      {
        name: "description",
        content:
          "How SMOL STUUF works: runs of 10 to 50 pieces, simple materials, hand-finished, numbered editions of small objects.",
      },
      { property: "og:title", content: "About — SMOL STUUF" },
      {
        property: "og:description",
        content: "Small batches, simple materials, numbered editions. Personality from design, not price tags.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap about-view">
          <h1 className="about-hero">SMOL STUUF makes small things worth having around.</h1>
          <div className="about-grid">
            <div>
              <p>
                We print, cut, and cast small objects in small batches — desk stuff, little lights, weird little
                companions for your shelf. Nothing here is trying to be a statement piece. It's just good stuuf.
              </p>
              <p>
                Everything starts as an experiment: a leftover cork sheet, a 3D print that came out a little too good, a
                shape that looked funny from one angle and great from another. If it survives the second round, it
                becomes a product.
              </p>
            </div>
            <div>
              <p>
                We keep runs small on purpose — usually 10 to 50 pieces per batch — so every product number actually
                means something. Materials stay simple: PLA, cork, basic hardware. The personality comes from the
                design, not the price tag.
              </p>
              <div className="about-tags">
                <span className="tag-pill">SMALL BATCH</span>
                <span className="tag-pill">AFFORDABLE DESIGN</span>
                <span className="tag-pill">HAND-FINISHED</span>
                <span className="tag-pill">NUMBERED EDITIONS</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

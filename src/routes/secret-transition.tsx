import { assetUrl } from "@/lib/asset-url";
import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import fierceCharacter from "@/assets/cart-fierce-character.png.asset.json";
import { SECRET_ACCESS_KEY } from "@/components/smol/SecretGate";
import { dialogueReadingTime } from "@/hooks/use-dialogue";

export const Route = createFileRoute("/secret-transition")({
  head: () => ({ meta: [
    { title: "Checking the coast — SMOL STUUF" },
    { name: "description", content: "A hidden SMOL STUUF doorway." },
    { property: "og:title", content: "Checking the coast — SMOL STUUF" },
    { property: "og:description", content: "A hidden SMOL STUUF doorway." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: SecretTransition,
});

function SecretTransition() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.sessionStorage.getItem(SECRET_ACCESS_KEY) !== "open") {
      navigate({ to: "/", replace: true });
      return;
    }
    const timer = window.setTimeout(() => navigate({ to: "/secret" }), dialogueReadingTime("Hummm!!!! We're safe."));
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return <main className="secret-transition">
    <img src={assetUrl(fierceCharacter)} alt="Shop character cautiously checking the coast" width={1024} height={1024} />
    <h1>Hummm!!!! We&apos;re safe.</h1>
    <p>Opening the suspicious little door…</p>
  </main>;
}
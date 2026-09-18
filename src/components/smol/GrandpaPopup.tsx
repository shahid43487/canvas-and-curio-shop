import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import grandpaAsset from "@/assets/funny-grandpa.webp.asset.json";

const lines = [
  "Cart ko dekha? It is feeling emotionally empty.",
  "Tiny object, giant explanation. Excellent choice.",
  "I inspected the vibes. Approved with mild confusion.",
];

export function GrandpaPopup() {
  const [visible, setVisible] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (window.sessionStorage.getItem("smol-grandpa-seen")) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("smol-grandpa-seen", "1");
      setLineIndex(Math.floor(Math.random() * lines.length));
      setVisible(true);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  const line = lines[lineIndex] ?? lines[0];

  return (
    <aside className="grandpa-popup" aria-live="polite">
      <Button className="grandpa-close" variant="ghost" size="icon" onClick={() => setVisible(false)} aria-label="Dismiss joke">
        <X size={17} />
      </Button>
      <img src={grandpaAsset.url} alt="A puzzled grandpa sticker" width={600} height={600} loading="lazy" />
      <p>{line}</p>
    </aside>
  );
}
import { assetUrl } from "@/lib/asset-url";
import { useEffect, useState } from "react";
import { resolveStickerSrc, useSite } from "@/lib/site";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogue } from "@/hooks/use-dialogue";
import character from "@/assets/shop-character.png";
import fierceCharacter from "@/assets/cart-fierce-character.png.asset.json";

const jokes = [
  { line: "Cart ko dekha? It is feeling emotionally empty.", sticker: assetUrl(fierceCharacter) },
  { line: "Tiny object, giant explanation. Excellent choice.", sticker: character },
  { line: "I inspected the vibes. Approved with mild confusion.", sticker: assetUrl(fierceCharacter) },
  { line: "My glasses say yes. My back says think about it.", sticker: character },
  { line: "Wallet called. I told it we don't take calls from strangers.", sticker: assetUrl(fierceCharacter) },
  { line: "Such a small thing. Such a big problem for my pocket.", sticker: assetUrl(fierceCharacter) },
  { line: "I am not saying don't buy it. I am saying don't tell anyone.", sticker: character },
  { line: "Everyone has this. Except everyone. Only you have this.", sticker: character },
  { line: "I checked the quality. Twice. Then I checked the price and sat down.", sticker: assetUrl(fierceCharacter) },
  { line: "Hmm. Suspiciously good. Nobody is this generous. Buy two.", sticker: assetUrl(fierceCharacter) },
];

export function GrandpaPopup() {
  const [visible, setVisible] = useState(false);
  const [jokeIndex, setJokeIndex] = useState(0);
  const site = useSite();
  const { dialogue, configuredSequence } = useDialogue({ line: jokes[0]?.line ?? "", expression: "hmm" });
  const assignedStickerSrc = resolveStickerSrc(dialogue.stickerId, site?.stickers.custom);

  useEffect(() => {
    const onCartOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      if (detail?.open) setVisible(false);
    };
    window.addEventListener("smol-cart-visibility", onCartOpen);
    return () => window.removeEventListener("smol-cart-visibility", onCartOpen);
  }, []);

  useEffect(() => {
    if (window.sessionStorage.getItem("smol-grandpa-seen")) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("smol-grandpa-seen", "1");
      const index = Math.floor(Math.random() * jokes.length);
      setJokeIndex(index);
      configuredSequence("grandpa-popup", [{ line: jokes[index]?.line ?? "", expression: "hmm" }], 0);
      setVisible(true);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [configuredSequence]);

  if (!visible) return null;
  const joke = jokes[jokeIndex] ?? jokes[0];
  if (!joke) return null;

  return (
    <aside className="grandpa-popup" aria-live="polite">
      <Button className="grandpa-close" variant="ghost" size="icon" onClick={() => setVisible(false)} aria-label="Dismiss joke">
        <X size={17} />
      </Button>
      <img src={assignedStickerSrc || joke.sticker} alt={dialogue.stickerId ? "Assigned dialogue sticker" : "Shop character reacting to the shop"} width={1024} height={1024} loading="lazy" />
      <p>{dialogue.line || joke.line}</p>
    </aside>
  );
}

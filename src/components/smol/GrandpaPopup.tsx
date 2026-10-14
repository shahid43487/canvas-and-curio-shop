import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import character from "@/assets/shop-character.png";
import fierceCharacter from "@/assets/cart-fierce-character.png.asset.json";

const jokes = [
  { line: "Cart ko dekha? It is feeling emotionally empty.", sticker: fierceCharacter.url },
  { line: "Tiny object, giant explanation. Excellent choice.", sticker: character },
  { line: "I inspected the vibes. Approved with mild confusion.", sticker: fierceCharacter.url },
  { line: "My glasses say yes. My back says think about it.", sticker: character },
  { line: "Wallet called. I told it we don't take calls from strangers.", sticker: fierceCharacter.url },
  { line: "Such a small thing. Such a big problem for my pocket.", sticker: fierceCharacter.url },
  { line: "I am not saying don't buy it. I am saying don't tell anyone.", sticker: character },
  { line: "Everyone has this. Except everyone. Only you have this.", sticker: character },
  { line: "I checked the quality. Twice. Then I checked the price and sat down.", sticker: fierceCharacter.url },
  { line: "Hmm. Suspiciously good. Nobody is this generous. Buy two.", sticker: fierceCharacter.url },
];

export function GrandpaPopup() {
  const [visible, setVisible] = useState(false);
  const [jokeIndex, setJokeIndex] = useState(0);

  useEffect(() => {
    if (window.sessionStorage.getItem("smol-grandpa-seen")) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("smol-grandpa-seen", "1");
      setJokeIndex(Math.floor(Math.random() * jokes.length));
      setVisible(true);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  const joke = jokes[jokeIndex] ?? jokes[0];
  if (!joke) return null;

  return (
    <aside className="grandpa-popup" aria-live="polite">
      <Button className="grandpa-close" variant="ghost" size="icon" onClick={() => setVisible(false)} aria-label="Dismiss joke">
        <X size={17} />
      </Button>
      <img src={joke.sticker} alt="Shop character reacting to the shop" width={1024} height={1024} loading="lazy" />
      <p>{joke.line}</p>
    </aside>
  );
}

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import babuLaugh from "@/assets/babu-laugh.png";
import babuShockedOpen from "@/assets/babu-shocked-open.png";
import babuPhoneConfused from "@/assets/babu-phone-confused.png";
import babuUnimpressed from "@/assets/babu-unimpressed.png";
import babuPointingLaugh from "@/assets/babu-pointing-laugh.png";
import babuPraying from "@/assets/babu-praying.png";
import babuShush from "@/assets/babu-shush.png";
import babuNervous from "@/assets/babu-nervous.png";
import babuHmm from "@/assets/babu-hmm.png";
import babuFacepalm from "@/assets/babu-facepalm.png";

const jokes = [
  { line: "Cart ko dekha? It is feeling emotionally empty.", sticker: babuShockedOpen },
  { line: "Tiny object, giant explanation. Excellent choice.", sticker: babuPointingLaugh },
  { line: "I inspected the vibes. Approved with mild confusion.", sticker: babuHmm },
  { line: "My glasses say yes. My back says think about it.", sticker: babuFacepalm },
  { line: "Wallet called. I told it we don't take calls from strangers.", sticker: babuPhoneConfused },
  { line: "Such a small thing. Such a big problem for my pocket.", sticker: babuPraying },
  { line: "I am not saying don't buy it. I am saying don't tell anyone.", sticker: babuShush },
  { line: "Everyone has this. Except everyone. Only you have this.", sticker: babuLaugh },
  { line: "I checked the quality. Twice. Then I checked the price and sat down.", sticker: babuNervous },
  { line: "Hmm. Suspiciously good. Nobody is this generous. Buy two.", sticker: babuUnimpressed },
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

  return (
    <aside className="grandpa-popup" aria-live="polite">
      <Button className="grandpa-close" variant="ghost" size="icon" onClick={() => setVisible(false)} aria-label="Dismiss joke">
        <X size={17} />
      </Button>
      <img src={joke.sticker} alt="A Babu Rao sticker reacting to the shop" width={1024} height={1024} loading="lazy" />
      <p>{joke.line}</p>
    </aside>
  );
}

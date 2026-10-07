import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dialogue } from "@/hooks/use-dialogue";
import hmm from "@/assets/babu-hmm.png";
import laugh from "@/assets/babu-laugh.png";
import praying from "@/assets/babu-praying.png";
import nervous from "@/assets/babu-nervous.png";
import facepalm from "@/assets/babu-facepalm.png";
import phone from "@/assets/babu-phone-confused.png";
import shocked from "@/assets/babu-shocked-open.png";
import shush from "@/assets/babu-shush.png";
import pointing from "@/assets/babu-pointing-laugh.png";
import unimpressed from "@/assets/babu-unimpressed.png";

const expressions: Record<string, string> = { hmm, laugh, praying, nervous, facepalm, phone, shocked, shush, pointing, unimpressed };

export function CheckoutSpeaker({ dialogue }: { dialogue: Dialogue }) {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (!ready) return;
    const viewport = window.visualViewport;
    const adjust = () => {
      const bottom = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
      // Runtime viewport geometry, not theme styling; keeps the speaker above the keyboard.
      ref.current?.style.setProperty("--keyboard-inset", `${bottom}px`);
    };
    adjust();
    viewport?.addEventListener("resize", adjust);
    viewport?.addEventListener("scroll", adjust);
    return () => { viewport?.removeEventListener("resize", adjust); viewport?.removeEventListener("scroll", adjust); };
  }, [ready]);
  if (!ready) return null;
  return createPortal(
    <aside ref={ref} className="checkout-speaker" aria-label="Checkout character">
      <p key={dialogue.line} className="checkout-speaker-bubble" lang="bn" aria-live="polite" aria-atomic="true">{dialogue.line}</p>
      <img src={expressions[dialogue.expression] ?? hmm} alt="Babu Rao reacting to your checkout" width={140} height={140} />
    </aside>, document.body,
  );
}
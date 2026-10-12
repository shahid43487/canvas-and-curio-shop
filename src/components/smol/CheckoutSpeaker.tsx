import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dialogue } from "@/hooks/use-dialogue";
import character from "@/assets/shop-character.png";

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
    const keepFieldClear = () => {
      const field = document.activeElement;
      if (!(field instanceof HTMLElement) || !field.matches("input, textarea, [role=radio]")) return;
      const bubble = ref.current?.getBoundingClientRect();
      if (!bubble) return;
      const rect = field.getBoundingClientRect();
      if (rect.bottom > bubble.top - 16) window.scrollBy({ top: rect.bottom - bubble.top + 24, behavior: "auto" });
    };
    const onFocus = () => requestAnimationFrame(() => { adjust(); keepFieldClear(); });
    const onResize = () => { adjust(); keepFieldClear(); };
    adjust();
    document.addEventListener("focusin", onFocus);
    viewport?.addEventListener("resize", onResize);
    viewport?.addEventListener("scroll", adjust);
    return () => { document.removeEventListener("focusin", onFocus); viewport?.removeEventListener("resize", onResize); viewport?.removeEventListener("scroll", adjust); };
  }, [ready]);
  if (!ready) return null;
  return createPortal(
    <aside ref={ref} className="checkout-speaker" aria-label="Checkout character">
      <p key={dialogue.line} className="checkout-speaker-bubble" lang="bn" aria-live="polite" aria-atomic="true">{dialogue.line}</p>
      <img src={character} alt="Shop character reacting to your checkout" width={140} height={140} />
    </aside>, document.body,
  );
}
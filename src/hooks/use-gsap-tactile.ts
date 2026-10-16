import { useEffect } from "react";
import gsap from "gsap";

const PRESS = "button, a, [role=button]";
const WIGGLE = "img[src*='sticker'], img[src*='babu'], img[src*='logo']";

// One delegated listener for the whole app: press springs + sticker wiggles.
export function useGsapTactile() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const down = (e: PointerEvent) => {
      const el = (e.target as Element).closest(PRESS);
      if (el) gsap.to(el, { scale: 0.94, duration: 0.08, ease: "power2.out", overwrite: true });
    };
    const up = (e: PointerEvent) => {
      const el = (e.target as Element).closest(PRESS);
      if (el) gsap.to(el, { scale: 1, duration: 0.45, ease: "elastic.out(1.2, 0.4)", overwrite: true });
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as Element).closest(WIGGLE);
      if (el && !gsap.isTweening(el))
        gsap.fromTo(el, { rotate: 0 }, { rotate: 6, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" });
    };
    addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    addEventListener("pointercancel", up);
    addEventListener("pointerover", over);
    return () => {
      removeEventListener("pointerdown", down);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
      removeEventListener("pointerover", over);
    };
  }, []);
}

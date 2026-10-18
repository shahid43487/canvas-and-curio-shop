import { useEffect } from "react";
import gsap from "gsap";
import { playSfx } from "@/lib/sfx";

const PRESS = "button, a, [role=button]";
const WIGGLE = ".drop-sticker, img[src*='sticker'], img[src*='babu']";

// One delegated listener for the whole app: press springs + sticker wiggles.
export function useGsapTactile() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const active = new Set<gsap.core.Tween>();
    const restores = new Map<HTMLElement, string>();
    const down = (e: PointerEvent) => {
      if (!(e.target instanceof Element)) return;
      const el = e.target.closest(PRESS);
      if (el) playSfx(el.matches(".card-add, .add-cart") ? "cart" : "click");
    };
    const over = (e: PointerEvent) => {
      if (reduced || !(e.target instanceof Element)) return;
      const el = e.target.closest<HTMLElement>(WIGGLE);
      if (!el || restores.has(el) || getComputedStyle(el).animationName !== "none") return;
      const originalRotate = el.style.rotate;
      const angle = { value: 0 };
      restores.set(el, originalRotate);
      const tween = gsap.to(angle, { value: 6, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut",
        onUpdate: () => { el.style.rotate = `${angle.value}deg`; },
        onComplete: () => { el.style.rotate = originalRotate; restores.delete(el); active.delete(tween); },
      });
      active.add(tween);
    };
    addEventListener("pointerdown", down);
    addEventListener("pointerover", over);
    return () => {
      removeEventListener("pointerdown", down);
      removeEventListener("pointerover", over);
      active.forEach((tween) => tween.kill());
      restores.forEach((rotate, el) => { el.style.rotate = rotate; });
    };
  }, []);
}

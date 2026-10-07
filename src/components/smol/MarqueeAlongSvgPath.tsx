import { useEffect, useId, useState } from "react";

const TEXT = "HANDMADE — WITH CHAOS — AND LOVE — SMOL STUUF — ";

export function MarqueeAlongSvgPath({ text = TEXT }: { text?: string }) {
  const id = useId().replace(/:/g, "");
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const content = text.repeat(6);
  return (
    <svg className="path-marquee" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
      <path id={id} d="M-20 90 C 200 10, 400 140, 600 70 S 1000 10, 1220 80" fill="none" />
      <use href={`#${id}`} className="path-marquee-track" />
      <text className="path-marquee-text">
        <textPath href={`#${id}`} startOffset="0%">
          {content}
          {!reduced && <animate attributeName="startOffset" from="0%" to="-100%" dur="60s" repeatCount="indefinite" />}
        </textPath>
      </text>
    </svg>
  );
}

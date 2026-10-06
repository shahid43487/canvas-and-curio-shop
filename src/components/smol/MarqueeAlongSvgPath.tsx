const TEXT = "SMOL THINGS. BIG MOOD. ✦ GOOD STUUF ☺ BATCH 04 ✷ ";

export function MarqueeAlongSvgPath({ text = TEXT }: { text?: string }) {
  const content = text.repeat(6);
  return (
    <svg className="path-marquee" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
      <path id="smol-wave" d="M-20 90 C 200 10, 400 140, 600 70 S 1000 10, 1220 80" fill="none" />
      <use href="#smol-wave" className="path-marquee-track" />
      <text className="path-marquee-text">
        <textPath href="#smol-wave" startOffset="0%">
          {content}
          <animate attributeName="startOffset" from="0%" to="-100%" dur="40s" repeatCount="indefinite" />
        </textPath>
      </text>
    </svg>
  );
}

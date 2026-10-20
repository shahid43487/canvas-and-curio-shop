// SVG versions of the CSS kinetic stickers so the library and dialogue speakers can use them.
const svg = (body: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${body}</svg>`)}`;
const INK = "#1E1B18", RED = "#E52A16", PAPER = "#FFFDF6";
const font = `font-family="Arial Black,Arial,sans-serif" font-weight="900"`;
const STAR = "60,6 67,39 99,22 81,51 114,60 79,70 99,100 66,85 60,114 51,84 21,100 37,69 6,59 39,49 21,20 52,38";

export const KINETIC_STICKERS = [
  { id: "peace-sign", label: "peace sign round sticker", src: svg(`<circle cx="62" cy="62" r="50" fill="${INK}"/><circle cx="58" cy="58" r="50" fill="${PAPER}" stroke="${INK}" stroke-width="5"/><text x="58" y="78" font-size="56" text-anchor="middle">✌</text>`) },
  { id: "eye", label: "the eye sticker", src: svg(`<ellipse cx="64" cy="66" rx="52" ry="30" fill="${INK}" transform="rotate(-9 60 60)"/><ellipse cx="60" cy="60" rx="52" ry="30" fill="${PAPER}" stroke="${INK}" stroke-width="5" transform="rotate(-9 60 60)"/><circle cx="60" cy="60" r="19" fill="${INK}"/><circle cx="66" cy="54" r="6" fill="${PAPER}"/>`) },
  { id: "stuuf-star", label: "STUUF star sticker", src: svg(`<polygon points="${STAR}" fill="${INK}" transform="translate(4 4)"/><polygon points="${STAR}" fill="${RED}" stroke="${INK}" stroke-width="4"/><text x="60" y="66" font-size="15" fill="${PAPER}" text-anchor="middle" ${font}>STUUF</text>`) },
  { id: "spark-star", label: "spark star sticker", src: svg(`<path d="M60 4 C66 46 74 54 116 60 C74 66 66 74 60 116 C54 74 46 66 4 60 C46 54 54 46 60 4Z" fill="${RED}" stroke="${INK}" stroke-width="4"/>`) },
  { id: "good", label: "GOOD STUUF round sticker", src: svg(`<circle cx="63" cy="63" r="50" fill="${INK}"/><circle cx="58" cy="58" r="50" fill="${RED}" stroke="${INK}" stroke-width="5"/><text x="58" y="54" font-size="17" fill="${PAPER}" text-anchor="middle" ${font}>GOOD</text><text x="58" y="74" font-size="17" fill="${PAPER}" text-anchor="middle" ${font}>STUUF ✓</text>`) },
  { id: "drop", label: "DROP 04 badge", src: svg(`<rect x="14" y="36" width="96" height="52" rx="4" fill="${INK}" transform="rotate(-6 60 60)"/><rect x="9" y="31" width="96" height="52" rx="4" fill="${RED}" stroke="${INK}" stroke-width="4" transform="rotate(-6 60 60)"/><text x="57" y="66" font-size="20" fill="${PAPER}" text-anchor="middle" transform="rotate(-6 60 60)" ${font}>DROP 04</text>`) },
];

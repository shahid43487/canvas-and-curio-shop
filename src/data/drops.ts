// Every PNG sticker/character in src/assets is available automatically.
const PNGS = import.meta.glob("@/assets/*.png", { eager: true, import: "default" }) as Record<string, string>;
const BUILT_IN = Object.entries(PNGS).map(([path, src]) => {
  const id = path.split("/").pop()!.replace(/\.png$/, "");
  return { id, label: id.replace(/-/g, " "), src };
});

// ponytail: drops live in code until a campaigns table exists; edit this file to publish.
export type Preset = "split" | "chaos" | "editorial" | "prank";
export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  accent: string;
  sub: string;
  cta: { label: string; to: string };
  sticker: string;
  preset: Preset;
  startsAt?: string;
  ctaUrl?: string;
  secondary?: { label: string; to: string };
  badge?: string;
  image?: string;
  rotation?: number;
  hidden?: boolean;
  endsAt?: string;
};

export const STICKERS: { id: string; label: string; src: string }[] = [
  ...BUILT_IN,
  { id: "good", label: "GOOD STUUF ✓", src: "" },
  { id: "drop", label: "DROP 04", src: "" },
];

export const PRESETS: Record<Preset, { label: string; note: string }> = {
  split: { label: "Split hero", note: "Text left, art right" },
  chaos: { label: "Full-bleed chaos", note: "Big type, stickers everywhere" },
  editorial: { label: "Minimal editorial", note: "Quiet type, one sticker" },
  prank: { label: "Prank alert", note: "Red alarm energy" },
};

export const SLIDES: Slide[] = [
  { id: "batch04", eyebrow: "NEW DROP · BATCH 04 LIVE", title: "SMOL THINGS.", accent: "BIG MOOD.", sub: "Small-batch objects, made a little weird on purpose. 3D-printed, cork-cut, and hand-finished — never generic, never precious.", cta: { label: "Shop the drop", to: "/shop" }, sticker: "drop", preset: "split" },
  { id: "desk", eyebrow: "DESK CHAOS EDITION", title: "TIDY DESK?", accent: "NEVER HEARD.", sub: "Trays, hooks and bookends for people who lose pens professionally.", cta: { label: "Fix my desk", to: "/shop" }, sticker: "babu-laugh", preset: "chaos" },
  { id: "why", eyebrow: "BABU RAO APPROVED", title: "WHY SO", accent: "SMOL?", sub: "Because big things are for big people. We make the tiny, numbered, slightly unhinged ones.", cta: { label: "Read the manifesto", to: "/about" }, sticker: "babu-pointing-laugh", preset: "editorial" },
];

export type SlideStatus = "live" | "scheduled" | "ended";
export function slideStatus(s: Slide, now = new Date()): SlideStatus {
  if (s.startsAt && new Date(s.startsAt) > now) return "scheduled";
  if (s.endsAt && new Date(s.endsAt) <= now) return "ended";
  return "live";
}
export const liveSlides = (list: Slide[] = SLIDES, now = new Date()) => list.filter((s) => !s.hidden && slideStatus(s, now) === "live");
export const stickerSrc = (id: string, extra: { id: string; src: string }[] = []) => [...STICKERS, ...extra].find((s) => s.id === id)?.src ?? "";

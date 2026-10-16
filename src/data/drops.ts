import babuLaugh from "@/assets/babu-laugh.png";
import babuShocked from "@/assets/babu-shocked-open.png";
import babuPointing from "@/assets/babu-pointing-laugh.png";
import babuShush from "@/assets/babu-shush.png";
import babuHmm from "@/assets/babu-hmm.png";
import babuPraying from "@/assets/babu-praying.png";

// ponytail: drops live in code until a campaigns table exists; edit this file to publish.
export type Preset = "split" | "chaos" | "editorial" | "prank";
export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  accent: string;
  sub: string;
  cta: { label: string; to: "/shop" | "/about" };
  sticker: string;
  preset: Preset;
  startsAt?: string;
  endsAt?: string;
};

export const STICKERS = [
  { id: "laugh", label: "Babu laugh", src: babuLaugh },
  { id: "shocked", label: "Babu shocked", src: babuShocked },
  { id: "pointing", label: "Babu pointing", src: babuPointing },
  { id: "shush", label: "Babu shush", src: babuShush },
  { id: "hmm", label: "Babu hmm", src: babuHmm },
  { id: "praying", label: "Babu praying", src: babuPraying },
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
  { id: "desk", eyebrow: "DESK CHAOS EDITION", title: "TIDY DESK?", accent: "NEVER HEARD.", sub: "Trays, hooks and bookends for people who lose pens professionally.", cta: { label: "Fix my desk", to: "/shop" }, sticker: "laugh", preset: "chaos" },
  { id: "why", eyebrow: "BABU RAO APPROVED", title: "WHY SO", accent: "SMOL?", sub: "Because big things are for big people. We make the tiny, numbered, slightly unhinged ones.", cta: { label: "Read the manifesto", to: "/about" }, sticker: "pointing", preset: "editorial" },
];

export type SlideStatus = "live" | "scheduled" | "ended";
export function slideStatus(s: Slide, now = new Date()): SlideStatus {
  if (s.startsAt && new Date(s.startsAt) > now) return "scheduled";
  if (s.endsAt && new Date(s.endsAt) <= now) return "ended";
  return "live";
}
export const liveSlides = (now = new Date()) => SLIDES.filter((s) => slideStatus(s, now) === "live");
export const stickerSrc = (id: string) => STICKERS.find((s) => s.id === id)?.src ?? "";

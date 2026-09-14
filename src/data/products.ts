export type Product = {
  id: number;
  num: string;
  name: string;
  price: string;
  color: string;
  tag: string;
  material: string;
  dims: string;
  batch: string;
  desc: string;
  colors: string[];
};

export const PRODUCTS: Product[] = [
  {
    id: 1,
    num: "STUUF / 001",
    name: "Blob Lamp",
    price: "$28",
    color: "var(--smol-yellow)",
    tag: "NEW STUUF",
    material: "PLA + frosted diffuser",
    dims: "9 × 9 × 14 cm",
    batch: "Batch 04 · 32 pcs",
    desc: "A small lopsided light that looks like it's mid-laugh. Warm glow, soft silicone base, plugs into any USB-C brick.",
    colors: ["var(--smol-yellow)", "var(--smol-pink)", "var(--smol-cyan)"],
  },
  {
    id: 2,
    num: "STUUF / 002",
    name: "Cork Wobble Tray",
    price: "$18",
    color: "var(--smol-cyan)",
    tag: "BEST STUUF",
    material: "Pressed cork sheet",
    dims: "16 × 10 × 2 cm",
    batch: "Batch 03 · 50 pcs",
    desc: "An intentionally uneven catch-all tray. Holds keys, rings, the one screw you're saving for later.",
    colors: ["var(--smol-cyan)", "#D9B98A", "var(--smol-green)"],
  },
  {
    id: 3,
    num: "STUUF / 003",
    name: "Little Guy Hook",
    price: "$12",
    color: "var(--smol-pink)",
    tag: "WEIRD ONE",
    material: "PLA, wall-mount",
    dims: "5 × 5 × 8 cm",
    batch: "Batch 04 · 40 pcs",
    desc: "A tiny wall creature that holds your headphones so they stop living on the floor. Comes with 2 screws.",
    colors: ["var(--smol-pink)", "var(--smol-purple)", "var(--smol-ink)"],
  },
  {
    id: 4,
    num: "STUUF / 004",
    name: "Stack Rings Organizer",
    price: "$22",
    color: "var(--smol-purple)",
    tag: "LIMITED",
    material: "PLA, modular",
    dims: "12 × 12 × 6 cm",
    batch: "Batch 04 · 24 pcs",
    desc: "Three wobbly rings that stack any way you like. Desk toy first, organizer second.",
    colors: ["var(--smol-purple)", "var(--smol-yellow)", "var(--smol-cyan)"],
  },
  {
    id: 5,
    num: "STUUF / 005",
    name: "Sun Coaster Set",
    price: "$16",
    color: "var(--smol-red)",
    tag: "NEW STUUF",
    material: "Pressed cork, set of 4",
    dims: "10 × 10 × 0.5 cm",
    batch: "Batch 04 · 36 sets",
    desc: "Four coasters, one grumpy little sun graphic. Protects tables, starts conversations.",
    colors: ["var(--smol-red)", "var(--smol-ink)", "#D9B98A"],
  },
  {
    id: 6,
    num: "STUUF / 006",
    name: "Squiggle Bookend",
    price: "$24",
    color: "var(--smol-green)",
    tag: "RESTOCKED",
    material: "PLA, weighted base",
    dims: "8 × 8 × 15 cm",
    batch: "Batch 02 · restock",
    desc: "Sold in singles because your books probably don't match anyway. Heavy enough to actually work.",
    colors: ["var(--smol-green)", "var(--smol-pink)", "var(--smol-ink)"],
  },
];

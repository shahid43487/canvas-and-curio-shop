export const pageHead = (title: string, description: string) => ({ meta: [
  { title: `${title} — SMOL STUUF` },
  { name: "description", content: description },
  { property: "og:title", content: `${title} — SMOL STUUF` },
  { property: "og:description", content: description },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary" },
] });
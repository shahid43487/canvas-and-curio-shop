// Assets are local bundled files; legacy { url } pointers still accepted.
export const assetUrl = (asset: string | { url: string }) => (typeof asset === "string" ? asset : asset.url);

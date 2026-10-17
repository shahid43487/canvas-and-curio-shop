// Absolute delivery also works when the source is hosted outside Lovable.
export const assetUrl = (asset: { url: string }) => new URL(asset.url, "https://tanstack-blossom-kit.lovable.app").href;
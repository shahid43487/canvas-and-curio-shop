# Managed asset inventory

The following `.asset.json` files are pointers, **not image bytes**. Their public `/__l5e/assets-v1/` paths resolve through Lovable hosting only; they do not exist on an arbitrary external host. The current assetUrl helper returns the same-origin path. Never replace it with another project's domain.

| Pointer in src/assets | Size (bytes) | Public path | Direct source use |
|---|---:|---|---|
| `cart-fierce-character.png.asset.json` | 1,178,678 | `/__l5e/assets-v1/fb73bc53-e1e7-4508-a52d-751d92cbd244/cart-fierce-character.png` | `src/routes/secret-transition.tsx`, `src/components/smol/CartSheet.tsx`, `src/components/smol/CheckoutSpeaker.tsx`, `src/components/smol/GrandpaPopup.tsx` |
| `header-normal-reference.jpg.asset.json` | 52,913 | `/__l5e/assets-v1/391800c9-2546-4482-9a9a-e3b0fbf08f62/header-normal-reference.jpg` | `src/components/smol/SiteHeader.tsx` |
| `header-vault-reference.jpg.asset.json` | 46,591 | `/__l5e/assets-v1/8550532b-6c64-4f06-b16f-7c7c38f09cdd/header-vault-reference.jpg` | `src/components/smol/SiteHeader.tsx` |
| `smol-header-logo.png.asset.json` | 1,280,049 | `/__l5e/assets-v1/194f9793-2220-4e0d-a46c-d233c10fcbcc/smol-header-logo.png` | `src/components/smol/SiteHeader.tsx` |
| `smol-header-texture.png.asset.json` | 489,112 | `/__l5e/assets-v1/76659bbc-8e99-416b-becf-17216336fab6/smol-header-texture.png` | No direct source import found (reference/archive asset) |
| `smol-stuuf-logo-paper.png.asset.json` | 865,467 | `/__l5e/assets-v1/ee30ee45-1018-4cdf-9c7d-7a87a7f7d0dc/smol-stuuf-logo-paper.png` | No direct source import found (reference/archive asset) |
| `smol-stuuf-logo.png.asset.json` | 452,853 | `/__l5e/assets-v1/e49589a6-279b-48d1-a837-1f4a1260f217/smol-stuuf-logo.png` | `src/routes/checkout.tsx`, `src/routes/index.tsx`, `src/components/smol/SiteHeader.tsx` |

## Independent hosting

No binaries were copied/downloaded for this handoff. Existing ordinary PNG/JPG imports in src/assets are already tracked source assets and need no pointer resolver. For managed files, obtain authorized original bytes or an existing portable backup archive, then restore each pointer's exact public path under `public/` on your deployment (for example public/__l5e/assets-v1/<asset-id>/<filename>). Do not fabricate IDs or pointers. Alternatively, a separately scoped future code change can replace imports with local assets/your own asset service.

`scripts/backup-assets.py` inventories ordinary images plus managed pointers and attempts an archive from a supplied current-site origin. `scripts/restore-assets.py` expects manifest.json and archive bytes beside the restore script, verifies size/checksum and restores manifest public paths. The scripts alone are not a binary backup; no archive or successful transfer was verified here. Files uploaded through the admin console live in the private media bucket and URLs may be embedded in database site_settings; those files require a separate private transfer and URL reissuance. Google-hosted Archivo Black/Hind fonts are referenced in the root head and require network access; they were not downloaded.

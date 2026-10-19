# SMOL STUUF — GitHub project context

Captured 2026-10-19 from source and read-only live backend catalogs. This is a handoff, not a claim that Git contains hosted data or credentials. Read AGENTS.md first; its complete current contents are reproduced below.

## Stack and commands

React 19, TypeScript, TanStack Start v1 and TanStack Router, React Query, Tailwind CSS v4, Radix/shadcn controls, GSAP, Zod, and Lovable Cloud (PostgreSQL, auth and object storage). The current package.json pins Vite 8.1.5; do not assume the older template's Vite 7. The Vite configuration uses @lovable.dev/vite-tanstack-config and Nitro, defaulting to Cloudflare Workers. The server entry is src/server.ts; src/start.ts installs error, CSRF and bearer-token middleware. Preserve Web API compatibility on the edge; Node-only server libraries need a separately chosen deployment target.

```sh
bun install
bun dev
bun run build
```

Also available: bun run preview, bun run lint, bun run format. Use package.json and the lockfile as authoritative. Supply .env.example variables from your own provider/hosting settings; never reuse committed configuration as proof of a working backend. VITE_* values are public and baked into the client build. Server secrets must be injected by the runtime. A Git clone can be edited without Lovable, but a working independently hosted shop still needs the services and media below. No install, build, preview or tests were run for this documentation task.

## Routes

| URL | Source | Purpose |
|---|---|---|
| / | src/routes/index.tsx | Homepage/drop slides |
| /shop | src/routes/shop.tsx | Public catalog |
| /about | src/routes/about.tsx | About |
| /product/$id | src/routes/product.$id.tsx | Product/options |
| /secret | src/routes/secret.tsx | Reverse/vault shop |
| /secret/product/$id | src/routes/secret.product.$id.tsx | Vault product |
| /secret-transition | src/routes/secret-transition.tsx | Vault transition |
| /checkout | src/routes/checkout.tsx | Checkout |
| /order/$id | src/routes/order.$id.tsx | Narrow guest confirmation |
| /auth | src/routes/auth.tsx | Customer and admin sign-in |
| /reset-password | src/routes/reset-password.tsx | Password recovery |
| /account | src/routes/_authenticated/account.tsx | Owner-scoped customer account |
| /admin | src/routes/admin.tsx + admin.index.tsx | Admin shell/overview |
| /admin/orders | src/routes/admin.orders.tsx | Orders |
| /admin/products | src/routes/admin.products.tsx | Catalog/options |
| /admin/campaigns | src/routes/admin.campaigns.tsx | Hero slides |
| /admin/coupons | src/routes/admin.coupons.tsx | Customer coupons |
| /admin/media | src/routes/admin.media.tsx | Media/audio |
| /admin/assets | src/routes/admin.assets.tsx | Stickers |
| /admin/settings | src/routes/admin.settings.tsx | Socials and settings |

__root.tsx supplies shared providers and Outlet; _authenticated/route.tsx is a pathless, client-rendered auth gate. routeTree.gen.ts is generated, never hand-edit it. Use TanStack file routes, not React Router or an App.tsx page switcher. Every layout renders Outlet. Distinct content routes have their own metadata; use pageHead and preserve unique titles/descriptions, og:type and twitter:card. Do not add relative/placeholder social preview image URLs.

## Key modules

src/components/smol: SiteHeader/SiteFooter, DropsHero, ProductCard/ProductImage, VariationSelector/PacmanConfigurator, CartSheet, CheckoutSpeaker, GrandpaPopup, SecretGate, StickerField/StickerBurst, SoundBar, AdminUpload, Glyph and MarqueeAlongSvgPath. src/hooks: use-cart, use-customer, use-dialogue, use-gsap-tactile, use-mobile. src/lib: products.functions, site.functions, orders.functions, account.functions, admin.functions, admin-auth.functions, admin-session, asset-url, pacman-config, coupon, page-head and sfx. src/data has bundled product/drop fallback content. src/styles.css owns theme tokens. See DATABASE.md for persisted data and ASSETS.md for managed media.

## Authentication and admin — actual current behavior

Customer email/password signup, login and password recovery use the generated browser auth client. Google/Lovable OAuth goes through @lovable.dev/cloud-auth-js and sets a backend session. Root listens for auth changes; /account checks getUser before loading. Account server functions use requireSupabaseAuth, verify the bearer token and read/update through the user's RLS-scoped client. src/start.ts attaches the bearer token to server functions and applies CSRF checks. Customer cancellation calls cancel_customer_order, which checks ownership, pending status and unpaid payment state, then atomically cancels/restocks/releases a coupon.

Admin is currently a separate secret-based system, NOT a user_roles system. /auth routes login emails ending in @admin to adminSignIn; the entered email and password must match ADMIN_LOGIN_EMAIL and ADMIN_LOGIN_PASSWORD on the server. It returns an HMAC-SHA256 token valid for eight hours. /admin alternatively accepts ADMIN_TOKEN directly, validates it through adminDashboard and stores the token in tab sessionStorage using src/lib/admin-session.tsx. Session storage is transport/persistence, not proof of privilege: every admin server handler calls admin(token), validates the raw token or signed expiry/signature, and only then dynamically imports the privileged server client. No admin credentials are included here. Signing out clears that tab's token; rotating ADMIN_TOKEN invalidates signatures. For future role-based authorization, use a protected separate user_roles table and server validation, never profile fields, browser flags or hardcoded passwords.

App-internal operations use createServerFn; do not move them into legacy edge functions. External webhooks/cron/OAuth callbacks belong under src/routes/api/public/* and must validate callers because that prefix bypasses site auth. No such public API routes currently exist. The cron-auth helper exists but does not prove a configured schedule.

## Lovable-only state and restoration

| State outside Git | Restore on independent hosting |
|---|---|
| Database rows: products/options, orders/items, profiles/coupons, site_settings (slides, sound, stickers, socials, slideInterval) | Export authorized data from Lovable's database export UI (More → Database → Manage → Settings → Export data), then import privately into your independently managed backend. This handoff contains schema only, no customers/orders/seeds. |
| Database schema deployed outside migration history | Provision a compatible PostgreSQL/auth/storage stack and apply drizzle/schema.snapshot.sql to an empty application schema, following DATABASE.md prerequisites and security caveats. drizzle/schema.ts stays blank; migration history is intentionally empty. |
| Auth users, password hashes/sessions, provider configuration, email templates and delivery settings | Reconfigure provider credentials, redirect allowlists, email confirmation/recovery and mail delivery on your own auth service. Migrate users only through supported private exports/imports or have customers create/reset credentials. Exact hosted auth settings were not read and remain unverified. No anonymous signup or auto-confirm unless explicitly requested. |
| Secrets and runtime environment | Provision your own credentials using .env.example names and your hosting secret manager. Managed service-role credentials/database passwords are not available from Lovable Cloud; obtain new credentials from a backend you control, not from this repository. Never commit private .env files. |
| Storage bucket configuration and uploaded media/audio files | Recreate private media bucket (20 MiB limit, unrestricted MIME types) through your storage provider API/UI. Transfer object bytes privately and reissue upload/read URLs; signed URLs in site_settings are data, not permanent portable files. No custom storage policies were observed. |
| Managed CDN binaries behind .asset.json pointers | Restore an existing portable archive if available, or obtain authorized media and serve the exact same-origin paths. ASSETS.md lists pointers. No binary transfer was performed here. |
| Server function hosting/configuration | Source functions are in Git, compiled by TanStack Start; provision runtime bindings, environment, same-origin server endpoints and TLS in the target host. There is no separate server-function configuration export in Git. Deploy the full server build, not a static-only frontend. Hosted schedules and deployed legacy functions were not inventoried. |
| Lovable AI/auth gateways, integrations and connector grants | Reconnect services under your own provider accounts. Current source uses Lovable OAuth and the Lovable Vite/server environment; these do not become portable simply by cloning. Replacing gateway/provider adapters is future work, not part of this handoff. Integration settings/tokens were not queried. |
| Domains, DNS, TLS and publish settings | Configure your own domain/DNS/TLS and update auth callback allowlists. This remix has no confirmed published/custom domain; older README URLs are historical, not deployment configuration. |
| Git sync linkage, editor history, previews and injected tooling/session | Reconnect through Lovable Project settings → Git when needed. External Git workflows require provider write permissions. Git alone cannot restore Lovable editor history, managed sessions or project linkage. |
| Project Knowledge and memory | This file exports the supplied project-specific instructions and persistent project requirements below; platform tooling permissions and future changes must be checked separately. |

## Full Project Knowledge / custom instructions and AGENTS.md rules

The supplied Project Knowledge matches the project-specific bullets in the following verbatim AGENTS.md export. Do not treat the snapshot as permission to alter managed auth/storage schemas or expose secrets.

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep normal-shop and reverse-vault headers as variants of the shared SiteHeader so navigation and cart behavior stay consistent.
- Resolve managed asset pointers against the current site origin; independent deployments restore assets from the backup archive, never another project's domain.
- CSS owns shared button transforms and dedicated GSAP components own their animations; delegated sticker wiggles use independent rotation to preserve artwork tilt.
- Guest order lookups return only a narrow confirmation projection with masked delivery details; authenticated account reads retain full owner-scoped details.
- Use useDialogue for queued contextual reactions and shared reading durations so competing timers cannot replace unread lines. Every line is shown for 12–16s (dialogueReadingTime); the cart cycle and secret transition reuse it rather than their own timers.
- Portal the checkout speaker outside filtered page content and track visualViewport geometry so scrolling and mobile keyboards cannot clip it.

- Use explicit charcoal surface and foreground tokens for dark mode; never invert page or image colors because product photography must remain accurate.
- Select between the two approved character assets by panel and dialogue context, keeping existing dialogue timing and positioning shared so artwork changes do not disrupt reactions.
- Product options live in product_variations (price/stock per option, visuals in button_config); the order function re-reads option price and stock server-side, so button visuals never decide price.
- The remix starts with an empty migration directory; generate future migrations through the migration tool against the current backend, because copied migration history can target an unrelated database. Resetting repository history does not initialize or delete backend schema.


## Additional persistent project requirements exported from Lovable memory

- Customers need profiles, Google and email sign-in, coupon status, current orders and order history.
- Customers may cancel orders only before the admin confirms them (pending status only); the current SQL additionally blocks paid orders.
- Place Sign in beside About in both shared header variants.
- Never store the password supplied in chat in source or memory.
- Provide a Pac-Man option sticker builder and adjustable homepage slide timing in the admin console.
- Keep logos and stickers backed up for use outside Lovable without broken images.
- Use the Ponytail skill to keep implementation lean without skipping requested functionality. The skill body itself is not exported or present in this handoff; do not assume an external AI can invoke it.

## Backend safety conventions

Enable RLS and explicit grants for every new public table. User IDs belong in public application tables; only profiles and a protected user_roles table may reference auth.users with ON DELETE CASCADE. Do not alter managed schemas, except an app-owned auth lifecycle trigger calling a public profile/role function. Validate any future signup trigger because failures block signup. Browser code imports the generated client; authenticated server functions use requireSupabaseAuth and context.supabase; privileged operations import client.server only inside handlers after verifying the caller. Never expose service-role keys, use admin reads to infer ordinary customer permissions, or send opaque publishable keys as bearer JWTs. Preserve existing functionMiddleware; do not duplicate bearer attachment. Environment reads are server-only except import.meta.env.VITE_*. Do not directly edit generated clients/types/auth files or managed .env and backend config in Lovable. Regenerate using supported tooling.

Future database changes are additive: do not drop/rename live tables or columns, change types, or add required columns without defaults; backfill before constraints and mark retired fields deprecated. In Lovable generate future migrations through the migration tool; do not hand-edit journals/snapshots, drizzle/schema.ts, or add ORM models. The schema.snapshot.sql file is a reference/bootstrap export, NOT a new applied migration. An external AI without that tool can prepare SQL for review/application through Lovable; Git pushes do not apply migrations.

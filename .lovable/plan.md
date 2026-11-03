# SMOL STUUF optimization plan

Retired: Card Library / SMOL CLUB cards, achievements, sets, claims and rewards. Nothing in this plan brings them back.

## What the audit found
- The preview build is failing right now. `src/routes/admin.tsx:102` has a type error in the admin nav links (`activeOptions` can be undefined).
- The retired card feature is gone from routes and components. What is left: about 94 card/club rules in `src/styles.css`, plus the card tables and functions (`card_sets`, `card_definitions`, `customer_cards`, `customer_achievements`, `achievement_definitions`, `set_reward_claims`, `refresh_club_progress`, `claim_club_set`) and the deprecated `customer_coupons` table and columns in the database and generated types.
- Large images: 7 bundled PNGs are 0.45 to 1.7 MB each (logo, header logo, characters, stickers). `src/assets` totals 9.9 MB. The header logo (1.28 MB) loads on every page.
- SEO: 21 of 22 routes have `head()`. `public/` has `robots.txt` but no `sitemap.xml`. Product pages have no Product structured data.
- Data loading: `checkout.tsx`, `admin.tsx` and `__root.tsx` lean on `useEffect`. Public routes need checking for missing `errorComponent`/`notFoundComponent`.
- Git: this sandbox only shows Lovable's internal remotes and an edit branch. I can't confirm from here that the project syncs to GitHub `shahid43487/canvas-and-curio-shop` on `main`. Check Project settings → Git. Nothing will push to or overwrite a repository.

## Phase 1: Make the build reliable (high impact, low risk)
1. Fix the `admin.tsx` nav link type: build the link props conditionally.
2. Run `tsgo` and the vitest suite. Remove or update `src/lib/card-upload.test.ts` and `src/lib/club*` if they still exist, so no retired imports remain.
- Check: the build log shows OK, typecheck is clean, tests pass.

## Phase 2: Speed and Core Web Vitals
1. Re-encode the 7 heavy PNGs to WebP/AVIF at display size (target under 150 KB each) and keep the originals' filenames as fallbacks.
2. Preload the homepage hero/logo image. Lazy-load stickers and characters below the fold. Give every image width and height to stop layout shift.
3. Load GSAP-heavy pieces (PacmanConfigurator, HeroCanvasEditor) only on the admin routes that use them.
4. Delete the unused card/club CSS blocks from `styles.css`.
- Check: compare Playwright load timings and transferred bytes on `/`, `/shop` and `/product/$id`, before and after. Screenshots should show the visuals unchanged.

## Phase 3: Storefront UX, mobile and accessibility
1. Audit icon-only buttons (cart, sound bar, header, close buttons) for `aria-label`. Raise mobile tap targets to 44px or more.
2. Use exactly one `<main>` landmark and a correct heading order on each route. Replace `h-screen` with `h-dvh`.
3. Respect `prefers-reduced-motion` in GSAP hover/entrance effects and stickers. The existing animations stay as they are.
4. Add clear loading, empty and error states for shop, product, checkout, order lookup and account orders.
- Check: Playwright at 390px and 1280px on the main pages, keyboard tab-through, and console free of errors.

## Phase 4: Data fetching and caching
1. Move initial reads in checkout, product and shop to loader + `ensureQueryData`/`useSuspenseQuery`. Give public catalog reads a sensible `staleTime`.
2. Make sure every route with a loader has `errorComponent` and `notFoundComponent`. Remove admin mutations that swallow errors and show toasts instead.
- Check: typecheck, manual flows (shop → product → cart → checkout → order page), and network log with no duplicate requests.

## Phase 5: SEO and AI search
1. Add a `sitemap.xml` server route listing static pages and visible products. Reference it in `robots.txt`.
2. Add Product structured data plus title, description and og:image (the product's absolute photo URL) on `product.$id`. Add canonical links on leaf routes. Mark `/secret*`, `/admin*`, `/auth` and `/account` noindex.
3. Add `llms.txt` with a short shop summary.
- Check: fetch the server-rendered HTML for each route and confirm unique titles and tags. The sitemap returns valid XML.

## Phase 6: Security and access boundaries
1. Run the security scan and database linter, and review the results.
2. Review the admin token flow (`admin-auth.functions.ts`, `admin-session.tsx`): every admin server function must check the token server-side.
3. Confirm guest order lookup returns only the masked summary. Confirm order and stock rules are still enforced server-side.
4. Check media upload size and type limits on the admin upload paths.
- Check: scan results, plus calls without a token should be rejected.

## Phase 7: Admin usability (light touch)
- Add confirm dialogs on destructive admin actions, save-success and failure toasts, and better empty states in orders, products and media. No redesign.

## Database changes that delete data (NOT applied; each needs your separate approval)
- Drop the retired card tables: `set_reward_claims`, `customer_achievements`, `customer_cards`, `card_definitions`, `card_sets`, `achievement_definitions`. This permanently deletes customers' earned card records.
- Drop the functions `refresh_club_progress` and `claim_club_set`.
- Drop the `customer_coupons` table and the `orders.coupon_id` and `orders.discount_amount` columns. Old orders lose their discount history, so the columns should be archived first.
- Remove the `cards/` files from the media storage bucket.
Until you approve these, the tables stay untouched and the app simply stops reading them.

## Risks
- Re-encoding images could shift colors slightly. Product photos are compared side by side.
- Changing loaders could change first-load behavior. This is done one route at a time and checked each time.

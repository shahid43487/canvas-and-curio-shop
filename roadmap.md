# Roadmap

## Current request — October 26
- [x] Fix the `//`-comment CSS build error in styles.css
- [x] Recreate the three tables the remix reset dropped (achievement_definitions, customer_cards, customer_achievements) with RLS + grants, seeded the five achievement definitions
- [x] getAccount now tolerates and lazy-creates a missing member profile row
- [x] Verified signed-in /account and /admin/coupon-library end-to-end (screenshots, zero console errors, typecheck clean)


## Hero canvas — October 21
- [ ] Build inline campaign canvas with editable layers and independent desktop/mobile placement
- [ ] Render published canvas slides while preserving legacy slides and logo interactions
- [ ] Verify dragging, editing, undo, and saved layouts

## Remix setup — October 18
- [x] Update the three admin secrets through secure fields
- [x] Clear copied migrations and leave an empty migration directory for the new database

## Approved master plan — October 18
- [ ] Restore same-origin assets and speed up guest loading
- [ ] Preserve sticker tilt and mobile slide stickers; reject mismatched uploads
- [ ] Verify cancellation safeguards, atomic restocking, and private guest order responses
- [ ] Verify storefront and customer flows; deliver portable asset archive

## Approved October 17 work
- [ ] Fix shared admin token and verify catalog plus all editors
- [ ] Add Pac-Man option builder
- [ ] Add slide duration control
- [ ] Back up brand assets for portable use
- [ ] Add customer sign-in, profiles, orders, coupons, and pending-only cancellation
- [ ] Secure unified admin sign-in (no hardcoded credential bypass)
- [ ] Verify central flows and rule checks

## Current request
- [x] Use both approved character stickers for distinct panels and contextual reactions
- [x] Replace all Babu Rao character images with the uploaded sticker
- [x] Rework dark mode with charcoal surfaces and colorful sticker accents
- [x] Verify character rendering, theme persistence, and checkout visibility

- [x] Re-time dialogue: priority tiers, short-beat pacing, two-beat sequences, 15s idle

## Next refinements — awaiting plan approval
- [ ] Rebuild both headers from the supplied dual-header reference
- [x] Move the animated ribbon above the manifesto with requested wording
- [ ] Rename cart and raise/enlarge its character without dialogue overlap
- [x] Extend one-liner reading time across all existing dialogue surfaces (12–16s)
- [ ] Keep contextual checkout character and dialogue visible at bottom right
- [ ] Contain the checkout summary badge and verify phone/desktop layouts

- [x] Refine mobile hero at 320px, 375px, and 430px
- [x] Add related products without duplicate queries
- [x] Add homepage manifesto panel from supplied reference
- [x] Add reusable, dismissible grandpa popup outside checkout
- [x] Add hidden prank catalog, guarded routes, transition, and five-click trigger
- [x] Enforce pending bKash verification and show payment number in both checkout flows
- [x] Replace footer creature with an original dancing dragon
- [x] Verify database, build, routes, checkout flows, and responsive layouts

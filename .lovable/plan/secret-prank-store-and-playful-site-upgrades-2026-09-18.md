# Secret prank store and playful site upgrades

## Goal
Extend the existing SMOL STUUF shop without rebuilding it: improve the phone layout, add recommendations and a homepage manifesto, introduce a reusable grandpa sticker, replace the footer creature with an original dragon, and unlock a hidden prank shop after five hero-logo clicks.

## Build plan

1. **Mobile hero refinement**
   - Preserve the desktop hero and its current dot treatment.
   - Tighten spacing and type at 320px, 375px, and 430px.
   - Stack and size the copy, buttons, logo, and floating elements so nothing clips or overlaps.

2. **Related products**
   - Reuse the existing products query and `ProductCard`.
   - Load the catalog once with the product detail, exclude the current product, and show up to three recommendations.
   - Use a three-column desktop row and a compact horizontal mobile scroller.

3. **Homepage manifesto**
   - Recreate the attached reference’s three offset, numbered color bands beneath Featured stuuf.
   - Preserve SMOL STUUF typography, palette, outlines, shadows, and responsive spacing.
   - Use original brand copy and lightweight decorative symbols.

4. **Reusable grandpa sticker**
   - Store the supplied sticker through the project asset system.
   - Build one dismissible popup component with original one-liners, smooth entrance/exit, session-limited frequency, and reduced-motion support.
   - Show it occasionally on Shop, About, and product pages; never on checkout or order confirmation.

5. **Secret prank store and Easter egg**
   - Make the hero logo an accessible five-click trigger with no visible navigation link.
   - Add a brief hidden transition page showing the sticker character looking left/right with: “Hummm!!!! We’re safe.” Then automatically enter the prank shop.
   - Add a secret-access marker in session storage so direct navigation redirects home unless unlocked in that browser session.
   - Add a small demo prank catalog in the existing products table, marked hidden and advance-payment-only; normal shop queries exclude it.
   - Reuse the existing cart and product cards, with a secret shop route and secret product detail support.
   - Keep secret and regular items from mixing in one cart to prevent checkout ambiguity.

6. **Advance-payment order safety**
   - Add hidden/advance-payment product flags and an order source flag through a database migration, with existing grants and row protections preserved.
   - Validate product IDs, current prices, stock, and advance-payment requirements on the server/database; ignore client-supplied prices and totals.
   - Secret checkout permits bKash only, shows `01600053340 (personal-send money)`, and requires a transaction ID.
   - Regular checkout keeps COD and bKash and shows the same bKash number.
   - A transaction ID creates a **pending payment-verification** order only. It is never marked paid or confirmed automatically because no bKash merchant verification API is connected.
   - Confirmation copy clearly distinguishes “submitted for verification” from a confirmed/paid order.

7. **Original dragon replacement**
   - Generate an original lanky black dancing dragon sticker inspired by the playful posture and green-eye energy of the supplied reference, without copying the referenced copyrighted character.
   - Replace only the existing footer monster asset and tune its existing lightweight motion.

8. **Verification**
   - Check build/runtime logs and database linting.
   - Test the five-click transition, hidden-route guard, prank browsing/cart/checkout submission, regular checkout labels, recommendations, popup dismissal/frequency, and all affected routes.
   - Visually inspect desktop plus 320px, 375px, and 430px widths for overflow and overlap.

## Expected files

- Existing: `src/routes/index.tsx`, `src/routes/product.$id.tsx`, `src/routes/shop.tsx`, `src/routes/about.tsx`, `src/routes/checkout.tsx`, `src/routes/order.$id.tsx`, `src/components/smol/ProductCard.tsx`, `src/components/smol/ProductImage.tsx`, `src/components/smol/SiteFooter.tsx`, `src/hooks/use-cart.tsx`, `src/lib/products.functions.ts`, `src/lib/orders.functions.ts`, `src/styles.css`
- New: reusable grandpa popup, manifesto, Easter-egg trigger/transition, secret shop and secret checkout routes, generated prank/dragon assets, and one database migration.

## Limitation

The requested personal-number bKash flow cannot independently prove a transfer through an API. Orders will remain pending until the transaction is checked manually; the site will not claim payment or order confirmation before that check.

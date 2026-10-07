# SMOL STUUF — Dual Headers and Dialogue Refinements

Planning only. No website changes until approved. Build in the order below, preserving product imagery, prices, checkout rules, existing Bengali copy, and the five-click secret entrance.

## 1. Dual headers first

- Rebuild the actual normal-shop and secret-vault headers from the supplied `Site_header_-_.smol-header.svg`, rather than restyling the current header loosely.
- **Normal shop:** navy painted texture, the supplied header logo, neon underline, yellow HOME and CART stickers, cyan SHOP, pink ABOUT, red BATCH 04 badge, yellow tagline and brush/star accents.
- **Secret vault:** the supplied light reverse-contrast design with the appropriate dark logo and legible navy lettering. Keep the vault itself dark.
- Match the reference's sticker angles, outline weight, placement, and proportions. Preserve each navigation sticker's color instead of letting the active state turn every link yellow.
- Retain a compact theme control, working navigation, cart count, and sticky behavior. Arrange controls deliberately on narrow phones instead of shrinking the entire desktop header or allowing badges to cover links.

## 2. Move the animated ribbon above the manifesto

- Remove the wavy animated ribbon from the hero and place it immediately above THE SMOL MANIFESTO.
- Replace the existing static manifesto ribbon with that moving ribbon, avoiding two copies in the same section.
- Repeat this exact wording along the ribbon:

  **HANDMADE — WITH CHAOS — AND LOVE — SMOL STUUF**

- Preserve the taped zine manifesto below it. Keep the ribbon readable, contained within the page width, and gently moving rather than fast or distracting.

## 3. Cart title and character clearance

- Change the cart heading from **Your Basta** to **কি কি নিলেন দেখি ?**
- Raise the fierce bearded character into the upper header area and enlarge it slightly: approximately 15–20% on desktop, with a constrained phone size.
- Reserve separate space for the title/count, character, and speech bubble. Neither the character nor its animation may cross the dialogue, close control, or quantity buttons.
- Keep the supplied sticker artwork and existing state-specific Bengali lines.

## 4. Longer reading time everywhere

- Cart cycling changes from every 5 seconds to a **minimum 12 seconds** per line; longer lines receive up to **16 seconds**.
- Removal and almost-checkout reactions receive the same reading time instead of disappearing after 3–4 seconds. Hover/focus must not keep restarting the same reaction.
- Checkout maintains one visible line continuously. Ordinary field/payment reactions queue instead of rapidly replacing a line before it can be read.
- Validation or order errors may immediately replace a lower-priority joke; they stay until resolved or followed by a relevant action. Actual field validation remains visible in its own place.
- Keep the existing 20-second checkout idle trigger, then show a relevant idle line only after the active line has had enough reading time.
- Existing shop popups and confirmation celebrations already remain until dismissed or navigation: preserve that behavior, with no new automatic dismissal.
- Keep the secret entrance transition as a transition, not an ongoing joke carousel; extend its current brief reading window without removing automatic navigation.

## 5. Always-visible checkout speaking sticker

- Replace the scrolling-away paragraph at the top of the form with a persistent **bottom-right sticker character and speech bubble** throughout the populated checkout, including secret checkout.
- Reuse the existing Babu Rao expression set on checkout, matching expressions to arrival, field completion, payment selection, cart quantity/value, idle, and validation reactions. Keep the fierce bearded character in the cart.
- The bubble always contains a contextual line; it does not fade out between lines or disappear when scrolling down.
- Desktop: compact character beside the bubble, anchored inside safe viewport edges.
- Phones: smaller character at the lower right with a wrapping bubble above/beside it and reserved bottom space so the last fields and payment button can scroll clear of it.
- Accommodate the on-screen keyboard so the speaker stays within the visible area without covering the focused input. Decorative areas must not intercept clicks.
- Preserve a readable bubble in both themes. Temporarily place cart/modal controls above it when those are open.

## 6. Contain the checkout summary sticker

- Replace the undersized, offset circular badge with a fitted sticker **inside** the summary layout.
- Keep **এই হিসাব ঠিকঠাক তো?** intact and readable, with natural line wrapping and room for its outline/shadow.
- Remove the negative right/bottom positioning responsible for overflow. Avoid text clipping and avoid shrinking Bengali text merely to fit the old circle.

## Animation direction

Use **Lovable Animation Choreographer**: subtle, smooth motion, targeted to these headers, ribbon, and dialogue surfaces.

- Header entrance: a single 200ms fade; interactive sticker hover lift about 2px, 200ms; click press/release no longer than 250ms.
- Character entrance: 15px fade-up, approximately 500ms. Keep ongoing movement minimal, with the bubble stable for reading.
- Dialogue changes: 150–200ms opacity transition, no empty interval and no large bounce that shifts text.
- Ribbon: slow continuous motion; stop movement for reduced-motion preferences while leaving its wording visible.
- Animate transform/opacity only for these refinements; disable decorative motion for reduced-motion users.
- No new artwork generation or alternative brand redesign is needed: the supplied headers and existing sticker set determine the visual direction.

## Technical implementation

- Reuse `SiteHeader`, `CartSheet`, `ManifestoPanel`, and `MarqueeAlongSvgPath`; keep normal/secret header variants in the shared header.
- Centralize dialogue timing and priority handling in a small shared utility/hook rather than scattering competing timers.
- Render the persistent checkout speaker through a client-side portal outside the filtered/transformed main content. The current dark-mode filter can otherwise make a fixed element behave as if attached to scrolling content.
- Clean up timers on navigation, avoid stale cart-value closures, and do not let ordinary queued reactions delay important errors.
- Use existing design tokens and control components. Record any new shared-module architecture in `AGENTS.md` during implementation.
- No payment, inventory, order-creation, or verification changes are included.

## Verification before completion

- Compare both rebuilt headers against the supplied reference, including real links, theme control, cart count, and the secret five-click entrance.
- Check 320px, 375px, 430px, and desktop widths, with both themes: no horizontal overflow, covered controls, or unreadable logo/text.
- Confirm the ribbon appears only above the manifesto, with the exact requested wording.
- Exercise empty/one/two-item carts, high/low totals, removal, and checkout focus; observe actual reading durations and character clearance.
- With a populated checkout, scroll top to bottom and focus phone/address/payment fields. Verify the speaker remains visible, the payment button stays reachable, and the summary sticker stays inside its container.
- Check reduced motion and inspect current build/runtime signals. Do not claim payment submission was tested unless an approved test order is actually submitted.

## Scope and budget

Only the requested refinements are included; the broader site dark-mode implementation is not being redesigned here. Reuse existing assets and focused edits to limit cost. The earlier four-credit target is a budget goal, not a guaranteed tool or verification cost.
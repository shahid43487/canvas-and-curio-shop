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
- The base shop tables (products, orders, order_items, the payment_method type, update_updated_at_column) exist only on the backend, not in a repo migration file — drizzle/migrations/0000 onward only alter them, so a fresh backend needs that base created first or the whole chain fails.

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
- Use useDialogue for queued contextual reactions and shared reading durations so competing timers cannot replace unread lines.
- Portal the checkout speaker outside filtered page content and track visualViewport geometry so scrolling and mobile keyboards cannot clip it.

- Use explicit charcoal surface and foreground tokens for dark mode; never invert page or image colors because product photography must remain accurate.
- Select between the two approved character assets by panel and dialogue context, keeping existing dialogue timing and positioning shared so artwork changes do not disrupt reactions.
- Product options live in product_variations (price/stock per option, visuals in button_config); the order function re-reads option price and stock server-side, so button visuals never decide price.

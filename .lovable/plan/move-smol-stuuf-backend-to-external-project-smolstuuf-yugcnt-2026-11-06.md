# Move SMOL STUUF backend to external project "Smolstuuf" (yugcntmmeitnbboyrupm, Sydney)

Audit only so far. Nothing has been changed.

## 1. What the app uses today

**Database tables still in use**
- products (15 queries), product_variations (8): shop, product pages, admin products — `src/lib/products.functions.ts`, `src/lib/supabase-public.ts`, `src/routes/sitemap[.]xml.ts`
- orders (5), order_items (2): checkout, order lookup, admin orders, account history — `src/lib/orders.functions.ts`, `src/lib/account.functions.ts`, `src/lib/admin.functions.ts`
- profiles (4): account page; created on first visit with the admin client — `src/lib/account.functions.ts`
- site_settings (2): hero slides, campaigns, canvas data, sticker library, dialogues, media/audio deck — `src/lib/site.functions.ts`, `src/lib/site.ts`, `src/lib/admin.functions.ts`

**Database functions in use**
- create_order_with_items / create_club_order / create_owned_order (checkout; the price and stock checks run on the server)
- cancel_customer_order (customer cancels a pending order)
- guard_cancelled_order, enforce_variation_limit and update_updated_at_column triggers
- admin_find_user_by_email (admin)

**Retired, not migrated:** card_definitions, card_sets, set_reward_claims, customer_cards, customer_achievements, achievement_definitions, customer_coupons, refresh_club_progress, claim_club_set. Old columns orders.coupon_id and orders.discount_amount get copied as they are, so the table stays the same shape, but nothing new uses them.

**Sign-in**
- Email/password sign-up, sign-in and password reset — `src/routes/auth.tsx`, `src/routes/reset-password.tsx`
- Google sign-in goes through Lovable's sign-in helper (`src/integrations/lovable/index.ts`, `@lovable.dev/cloud-auth-js`). This only works on Lovable Cloud and must be replaced with standard Google sign-in on the new project.
- Session listener in `src/routes/__root.tsx`, `use-customer.tsx`, the signed-in area gate `_authenticated/route.tsx`, and the server sign-in check (`auth-middleware.ts`, `auth-attacher.ts`, `start.ts`)
- Admin login is separate (ADMIN_LOGIN_EMAIL / ADMIN_LOGIN_PASSWORD / ADMIN_TOKEN in `src/lib/admin-auth.functions.ts`). It doesn't use backend accounts. `adminListCustomers` uses the admin user listing.

**Storage**
- One private bucket, `media`. Admin uploads go through a one-time upload link, and the app then saves a **10-year signed link** (`adminUploadUrl`, `adminFileUrl`, `uploadMedia` in `src/lib/site.ts`).
- Those signed links are saved inside site_settings (and possibly product images). They contain the old project address and the old signing key, so **they will all break after the move and must be rewritten**.
- `database_export_06_11_26` is an export bucket and is not needed.
- Logo, stickers and character art are bundled in the app (`src/assets`), so they don't depend on the backend.

**Not used:** realtime, edge functions, scheduled jobs (LOVABLE_CRON_SECRET is set but nothing calls it), and Lovable AI.

**Hard-coded project references:** none in app source. The project address and keys come from `.env` and `supabase/config.toml`. Both are managed by Lovable and are rewritten when the project is reconnected.

## 2. Migration design

1. **Schema:** apply a cleaned copy of `drizzle/schema.snapshot.sql` to Smolstuuf. It includes only the tables, enum, functions and triggers listed above, with the same row security rules and table permissions. I'd tighten the permissions while doing this: no public run access on the order functions beyond what checkout needs.
2. **Storage:** create a private `media` bucket on Smolstuuf with the same size limit, and copy every object at the same path. Then rewrite every saved signed link (in site_settings JSON and products.image_key) to a fresh signed link from the new project. A better long-term option is to store the path and sign links when they're needed, but that's optional.
3. **Data:** copy products, product_variations, orders, order_items, profiles and site_settings with their original IDs, so order and product links keep working. Copy auth users first, because profiles and orders refer to user IDs.
4. **Auth users:** a full database copy of the `auth` schema keeps user IDs **and password hashes**, so customers keep their passwords. Customers who use Google sign-in reconnect automatically by email once Google is set up on Smolstuuf. Current sessions end, so everyone signs in once more.
5. **App changes:** remove the Lovable sign-in helper, use standard Google sign-in, and point the app to the new keys. No changes to how checkout, prices or payment work.

**Cutover**
1. Keep Lovable Cloud running and untouched.
2. Do a dry-run copy to Smolstuuf and test it on a draft: shop, checkout, account, admin and media.
3. Briefly freeze the shop (stop orders), do a final copy of the data and files, then switch the app's keys.
4. Check that the counts and totals match.

**Rollback:** switch the keys back to Lovable Cloud. Orders placed on Smolstuuf after cutover would have to be copied back by hand, so keep the window short. Only disconnect Lovable Cloud after about two weeks of stable running, because disconnecting permanently deletes its data.

## 3. What I need from you (enter secrets only in Project Settings → Secrets, never in chat)

Safe to show in the browser:
- `VITE_SUPABASE_URL` = `https://yugcntmmeitnbboyrupm.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase → Project Settings → API Keys → publishable key (or the legacy anon key)
- `VITE_SUPABASE_PROJECT_ID` = `yugcntmmeitnbboyrupm`

Server only (Secrets):
- `SUPABASE_URL` (same address) and `SUPABASE_PUBLISHABLE_KEY` (same key). These are needed for the sitemap and public reads.
- `SUPABASE_SERVICE_ROLE_KEY`: API Keys → secret key or service_role. It's needed for admin tasks, orders, profile creation and uploads.
- Keep the existing ADMIN_TOKEN, ADMIN_LOGIN_EMAIL and ADMIN_LOGIN_PASSWORD as they are.
- Only for the one-time copy: `TARGET_DB_URL`. This is the database connection string from Supabase → Connect → Session pooler. Delete it afterwards.

Not needed: JWT secret, storage S3 keys, or a separate anon key if the publishable key is provided.

Set up in the Smolstuuf dashboard yourself:
- Google sign-in: Authentication → Providers → Google, with your own Google client ID and secret
- Site and redirect addresses for the published site and preview: Authentication → URL Configuration

## 4. What I can and can't copy myself

- **Database rows:** I can read the current Lovable Cloud data. With TARGET_DB_URL I can write it to Smolstuuf directly.
- **Auth users with passwords:** these sit in the protected `auth` schema. I can query them read-only here, but whether I can export the password hashes is unconfirmed. If I can't, use More → Database → Manage → Settings → Export project data, and I'll restore from that file.
- **Storage files:** I can read them with the current backend access and upload them to Smolstuuf using its secret key.

## 5. Blockers and steps that need your approval

- **Blocker:** Google sign-in has to be rebuilt without the Lovable helper. You need a Google client ID and secret.
- **Blocker:** whether this project can be pointed at an outside backend at all. Lovable Cloud can't be detached in place. Options are a remix that connects to your own Supabase, or keeping the Lovable-managed keys and adding a separate set (`EXT_SUPABASE_*`). I'll confirm which before building.
- **Approval:** briefly freezing the shop at cutover.
- **Approval:** rewriting saved media links in site_settings and products. I'll back up the current values first.
- **Approval, much later:** disconnecting Lovable Cloud. This is permanent.
- Everyone has to sign in again after the switch.

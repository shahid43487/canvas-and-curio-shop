# Database handoff

Captured from the current live backend on **2026-10-19** using read-only PostgreSQL catalog queries. [schema.snapshot.sql](../drizzle/schema.snapshot.sql) exports all seven public application tables, column types/defaults/nullability, named constraints, indexes, RLS policies, eight functions and four non-internal triggers. No row data or secrets are included. Formatting/qualification is normalized; function behavior and observed schema are preserved. This file is not an applied migration and drizzle/schema.ts remains untouched.

## Restore outside Lovable

1. Provision PostgreSQL 17+ plus a compatible auth and storage stack that provides `anon`, `authenticated`, `service_role`, `auth.users`, `auth.uid()` and the auth/storage HTTP APIs used by the existing client. A bare PostgreSQL database alone cannot run this app's authentication or uploads. The snapshot intentionally does not recreate platform-owned auth/storage/vault catalogs or system triggers.
2. Use a privileged migration connection to apply the snapshot **only to an empty public application schema**, with public in search_path. The owner must be trusted because SECURITY DEFINER functions inherit its rights. Do not run it on the existing live shop or inside the app on startup.
3. Recreate storage through its management API/UI: bucket ID/name `media`, **private**, file size limit **20,971,520 bytes (20 MiB)**, `allowed_mime_types = null`. No custom policies on storage.objects or storage.buckets were observed. Admin handlers use privileged signed upload/read URLs (read URLs currently request ten years). Object bytes and existing signed URLs are not included.
4. Configure auth providers/callbacks, email delivery and runtime secrets from [.env.example](../.env.example). Managed Lovable Cloud service-role credentials/database passwords cannot be extracted here; obtain new credentials from your own backend. Export/import permitted data privately and separately. An empty restored database has no products, settings, customers or orders.
5. Review the security findings below **before public deployment**. No changes were applied to the live database by this handoff. For future connected-project migrations use the Lovable migration tool; pushes to Git do not apply SQL. An external AI can prepare SQL and request its application through Lovable. Do not edit migration metadata or drizzle/schema.ts.

## Tables and relationships

| Table | Purpose | Relationships |
|---|---|---|
| products | Base catalog/stock, visibility and selector mode | Integer IDs are not auto-generated; admin allocates them |
| product_variations | Option price/stock, SKU and button_config | product_id → products, ON DELETE CASCADE; SKU unique |
| orders | Delivery, state, payment, totals and optional ownership/coupon | user_id and coupon_id have **no live foreign key** |
| order_items | Purchased quantities/prices and variation name | order → orders CASCADE; product → products RESTRICT; variation → product_variations |
| profiles | Display name/avatar | id → auth.users CASCADE |
| customer_coupons | Owner coupon and discount eligibility | user_id has no live FK |
| site_settings | JSON settings by key | No foreign keys |

The SQL is the detailed column/type/default reference. Every table has RLS enabled and not forced. Named PK/unique constraints create their btree indexes; additional indexes are orders_created_idx, orders_user_id_idx, order_items_order_idx and product_variations_product_idx. The enum `payment_method` contains `cod`, `bkash`. Checks enforce nonnegative catalog prices/stocks, quantity ≥1, bundle_quantity ≥1, valid order/payment/source/selector states and coupon discount ranges. The variation insertion trigger caps a product at twenty options.

## RLS and observed privileges

| Table | Policies |
|---|---|
| products | anon and authenticated SELECT only when is_hidden=false |
| product_variations | anon/authenticated SELECT active options of visible products |
| orders | authenticated SELECT own user_id |
| order_items | authenticated SELECT when the parent order is owned |
| profiles | authenticated own SELECT and own UPDATE (USING and WITH CHECK) |
| customer_coupons | authenticated SELECT own user_id |
| site_settings | anon/authenticated SELECT true |

No other application RLS policies were observed. Live ACLs grant anon/authenticated/service_role (and postgres) DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE and UPDATE on all seven tables; sandbox_exec has INSERT and SELECT. The snapshot reproduces the three application API roles' table grants, not the Lovable-only sandbox role. Schema public has USAGE for PUBLIC, postgres, anon, authenticated, service_role and sandbox_exec; pg_database_owner has USAGE/CREATE. Platform default grants for supabase_admin/postgres also exist; these are platform provisioning, not needed to reproduce explicit application grants. No application sequences, custom domains, generated columns or identity columns were observed. Owner and platform ACLs are not blindly recreated.

**Important security findings:** these live grants are broader than a least-privilege deployment needs. RLS filters ordinary row CRUD but does not make TRUNCATE/TRIGGER/REFERENCES/MAINTAIN privileges safe. All eight public functions have observed EXECUTE for PUBLIC, anon, authenticated, service_role and their postgres owner. In particular, SECURITY DEFINER order creation accepts inputs without caller authentication, create_owned_order accepts owner_id, and admin_find_user_by_email exposes a lookup without an internal admin check. Server-handler validation does not protect direct database API calls if a function itself is public. This is a faithful inventory, not a security endorsement: restrict privileged RPC execution to trusted server roles, review table privileges and retain owner-checked customer cancellation before exposing a new backend. No permissions were changed here.

## Functions and triggers

- update_updated_at_column: updates NEW.updated_at; used by products and variations BEFORE UPDATE.
- guard_cancelled_order: cancelled orders cannot be reopened; orders BEFORE UPDATE.
- enforce_variation_limit: rejects a twenty-first variation; product_variations BEFORE INSERT.
- create_customer_profile: profile insertion from auth user metadata; **no non-internal auth.users trigger was present in the live catalog**. Its existence alone does not guarantee profiles are created on signup. A future restoration must deliberately decide/test auth lifecycle wiring; this snapshot does not invent a missing trigger.
- admin_find_user_by_email: case-insensitive auth-user ID lookup.
- create_order_with_items: locks/re-reads prices and stock, enforces shop/source/payment rules, writes items and reduces stock.
- create_owned_order: wraps order creation, applies a locked eligible coupon, assigns ownership.
- cancel_customer_order: requires auth.uid ownership, pending and unpaid state; cancels/restocks/releases coupon atomically.

Installed platform extensions: plpgsql in pg_catalog, pg_stat_statements/uuid-ossp/pgcrypto in extensions, supabase_vault in vault. They are inventoried, not dumped; no extension internals or vault secrets are exported. PostgreSQL supplies gen_random_uuid on modern releases. Hosted auth settings, OAuth credentials, schedules, integrations and domains were not queried and are not asserted by the schema snapshot.

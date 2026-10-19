-- Live public application schema snapshot, 2026-10-19. SCHEMA ONLY; not an applied migration.
-- Target: empty public app schema on PostgreSQL 17+ with compatible auth/storage services.
-- Prerequisites: anon/authenticated/service_role roles, auth.users, auth.uid(), storage service.
-- Existing live grants are broad and public function execution is observed; review DATABASE.md
-- before exposing a restored deployment. This file preserves findings, not a security endorsement.
-- Platform-owned auth/storage/vault/extension internals are intentionally not reproduced.
SET search_path TO public;
CREATE TYPE public.payment_method AS ENUM ('cod', 'bkash');
GRANT USAGE ON SCHEMA public TO PUBLIC, anon, authenticated, service_role;

CREATE TABLE public.customer_coupons (
id uuid DEFAULT gen_random_uuid() NOT NULL,
user_id uuid NOT NULL, code text NOT NULL, description text DEFAULT ''::text NOT NULL,
expires_at timestamp with time zone, used_at timestamp with time zone,
discount_type text DEFAULT 'percent'::text NOT NULL, discount_value numeric DEFAULT 0 NOT NULL, min_order numeric DEFAULT 0 NOT NULL,
CONSTRAINT customer_coupons_pkey PRIMARY KEY (id),
CONSTRAINT customer_coupons_discount_check CHECK (((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text])) AND (discount_value >= 0) AND (min_order >= 0) AND ((discount_type <> 'percent'::text) OR (discount_value <= 100))))
);
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_coupons TO anon, authenticated, service_role;
ALTER TABLE public.customer_coupons ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
id uuid DEFAULT gen_random_uuid() NOT NULL, order_id uuid NOT NULL, product_id integer NOT NULL,
quantity integer DEFAULT 1 NOT NULL, unit_price numeric DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL,
variation_id uuid, variation_name text,
CONSTRAINT order_items_pkey PRIMARY KEY (id), CONSTRAINT order_items_quantity_check CHECK (quantity >= 1)
);
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_items TO anon, authenticated, service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.orders (
id uuid DEFAULT gen_random_uuid() NOT NULL, status text DEFAULT 'pending'::text NOT NULL,
payment_method public.payment_method DEFAULT 'cod'::public.payment_method NOT NULL, payment_status text DEFAULT 'pending'::text NOT NULL,
bkash_transaction_id text, shipping_name text NOT NULL, shipping_email text, shipping_phone text NOT NULL,
shipping_address text NOT NULL, shipping_city text NOT NULL, shipping_notes text, total_amount numeric DEFAULT 0 NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL, order_source text DEFAULT 'regular'::text NOT NULL,
user_id uuid, coupon_id uuid, discount_amount numeric DEFAULT 0 NOT NULL,
CONSTRAINT orders_pkey PRIMARY KEY (id),
CONSTRAINT orders_order_source_check CHECK (order_source = ANY (ARRAY['regular'::text, 'secret'::text])),
CONSTRAINT orders_payment_status_check CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text])),
CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text]))
);
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orders TO anon, authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.product_variations (
id uuid DEFAULT gen_random_uuid() NOT NULL, product_id integer NOT NULL, name text NOT NULL, sku text NOT NULL,
price numeric NOT NULL, compare_at_price numeric, stock integer DEFAULT 0 NOT NULL, bundle_quantity integer DEFAULT 1 NOT NULL,
image_key text, display_order integer DEFAULT 0 NOT NULL, is_active boolean DEFAULT true NOT NULL,
button_config jsonb DEFAULT '{}'::jsonb NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL,
CONSTRAINT product_variations_pkey PRIMARY KEY (id), CONSTRAINT product_variations_sku_key UNIQUE (sku),
CONSTRAINT product_variations_bundle_quantity_check CHECK (bundle_quantity >= 1),
CONSTRAINT product_variations_price_check CHECK (price >= 0), CONSTRAINT product_variations_stock_check CHECK (stock >= 0)
);
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.product_variations TO anon, authenticated, service_role;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.products (
id integer NOT NULL, num text DEFAULT ''::text NOT NULL, name text NOT NULL, price numeric DEFAULT 0 NOT NULL,
color text DEFAULT '#FFD23F'::text NOT NULL, tag text DEFAULT 'NEW'::text NOT NULL, material text DEFAULT ''::text NOT NULL,
dims text DEFAULT ''::text NOT NULL, batch text DEFAULT 'Batch 04'::text NOT NULL, description text DEFAULT ''::text NOT NULL,
colors text[] DEFAULT '{}'::text[] NOT NULL, stock integer DEFAULT 0 NOT NULL, image_key text DEFAULT ''::text NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL,
is_hidden boolean DEFAULT false NOT NULL, requires_advance_payment boolean DEFAULT false NOT NULL, selector_mode text DEFAULT 'none'::text NOT NULL,
CONSTRAINT products_pkey PRIMARY KEY (id), CONSTRAINT products_price_check CHECK (price >= 0),
CONSTRAINT products_stock_check CHECK (stock >= 0), CONSTRAINT products_selector_mode_check CHECK (selector_mode = ANY (ARRAY['none'::text, 'color'::text, 'pacman'::text]))
);
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.products TO anon, authenticated, service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
id uuid NOT NULL, display_name text DEFAULT ''::text NOT NULL, avatar_url text DEFAULT ''::text NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO anon, authenticated, service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_settings (
key text NOT NULL, value jsonb DEFAULT '{}'::jsonb NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL,
CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.site_settings TO anon, authenticated, service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Foreign keys added after all referenced tables exist. No orders.user_id/coupon_id FK exists live.
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_variation_id_fkey FOREIGN KEY (variation_id) REFERENCES public.product_variations(id);
ALTER TABLE public.product_variations ADD CONSTRAINT product_variations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- PK/UNIQUE constraints above automatically create the corresponding named btree indexes.
CREATE INDEX order_items_order_idx ON public.order_items USING btree (order_id);
CREATE INDEX orders_created_idx ON public.orders USING btree (created_at DESC);
CREATE INDEX orders_user_id_idx ON public.orders USING btree (user_id);
CREATE INDEX product_variations_product_idx ON public.product_variations USING btree (product_id, display_order);

CREATE POLICY "Customers read own coupons" ON public.customer_coupons AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Customers read own orders" ON public.orders AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Customers read own order items" ON public.order_items AS PERMISSIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Public reads active variations of visible products" ON public.product_variations AS PERMISSIVE FOR SELECT TO anon, authenticated USING (is_active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variations.product_id AND p.is_hidden = false));
CREATE POLICY "Public catalog excludes hidden products" ON public.products AS PERMISSIVE FOR SELECT TO anon USING (is_hidden = false);
CREATE POLICY "Customers read visible products" ON public.products AS PERMISSIVE FOR SELECT TO authenticated USING (is_hidden = false);
CREATE POLICY "Own profile read" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Public reads site settings" ON public.site_settings AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;
CREATE OR REPLACE FUNCTION public.guard_cancelled_order() RETURNS trigger LANGUAGE plpgsql SET search_path TO public AS $function$
BEGIN IF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN RAISE EXCEPTION 'Cancelled orders cannot be reopened'; END IF; RETURN NEW; END;
$function$;
CREATE OR REPLACE FUNCTION public.admin_find_user_by_email(lookup text) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public, auth AS $function$
SELECT id FROM auth.users WHERE lower(email) = lower(btrim(lookup)) LIMIT 1
$function$;
CREATE OR REPLACE FUNCTION public.cancel_customer_order(order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE target public.orders; item public.order_items;
BEGIN
SELECT * INTO target FROM public.orders WHERE id = order_id FOR UPDATE;
IF target.id IS NULL OR target.user_id IS DISTINCT FROM auth.uid() OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
IF target.status <> 'pending' OR target.payment_status = 'paid' THEN RAISE EXCEPTION 'Only pending, unverified orders can be cancelled'; END IF;
UPDATE public.orders SET status = 'cancelled' WHERE id = order_id;
IF target.coupon_id IS NOT NULL THEN UPDATE public.customer_coupons SET used_at = NULL WHERE id = target.coupon_id; END IF;
FOR item IN SELECT * FROM public.order_items WHERE order_items.order_id = target.id LOOP
IF item.variation_id IS NOT NULL THEN UPDATE public.product_variations SET stock = stock + item.quantity WHERE id = item.variation_id;
ELSE UPDATE public.products SET stock = stock + item.quantity WHERE id = item.product_id; END IF;
END LOOP; END;
$function$;
CREATE OR REPLACE FUNCTION public.create_customer_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
BEGIN INSERT INTO public.profiles(id, display_name, avatar_url) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')) ON CONFLICT DO NOTHING; RETURN NEW; END;
$function$;
CREATE OR REPLACE FUNCTION public.create_order_with_items(order_data jsonb, items jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE
new_order_id uuid; item jsonb; pid int; vid uuid; vname text; qty int; available int; current_price numeric;
advance_required boolean; hidden_product boolean; calculated_total numeric := 0;
requested_source text := COALESCE(NULLIF(order_data->>'order_source', ''), 'regular');
requested_payment public.payment_method := (order_data->>'payment_method')::public.payment_method;
BEGIN
IF jsonb_array_length(items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
IF requested_source NOT IN ('regular', 'secret') THEN RAISE EXCEPTION 'Invalid order source'; END IF;
FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
pid := (item->>'product_id')::int; vid := NULLIF(item->>'variation_id', '')::uuid; qty := (item->>'quantity')::int;
IF qty < 1 THEN RAISE EXCEPTION 'Invalid quantity for product %', pid; END IF;
SELECT stock, price, requires_advance_payment, is_hidden INTO available, current_price, advance_required, hidden_product FROM public.products WHERE id = pid FOR UPDATE;
IF available IS NULL THEN RAISE EXCEPTION 'Product % not found', pid; END IF;
IF vid IS NOT NULL THEN
available := NULL;
SELECT stock, price INTO available, current_price FROM public.product_variations WHERE id = vid AND product_id = pid AND is_active FOR UPDATE;
IF available IS NULL THEN RAISE EXCEPTION 'Variation not available'; END IF;
END IF;
IF available < qty THEN RAISE EXCEPTION 'Insufficient stock: requested %, available %', qty, available; END IF;
IF hidden_product <> (requested_source = 'secret') THEN RAISE EXCEPTION 'Regular and secret products cannot be mixed'; END IF;
IF advance_required AND requested_payment <> 'bkash' THEN RAISE EXCEPTION 'Advance payment is required for this product'; END IF;
calculated_total := calculated_total + (current_price * qty);
END LOOP;
IF requested_payment = 'bkash' AND NULLIF(BTRIM(order_data->>'bkash_transaction_id'), '') IS NULL THEN RAISE EXCEPTION 'bKash transaction ID is required'; END IF;
INSERT INTO public.orders (status, payment_method, payment_status, bkash_transaction_id, shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_notes, total_amount, order_source)
VALUES ('pending', requested_payment, 'pending', NULLIF(BTRIM(order_data->>'bkash_transaction_id'), ''), order_data->>'shipping_name', COALESCE(order_data->>'shipping_email', ''), order_data->>'shipping_phone', order_data->>'shipping_address', order_data->>'shipping_city', NULLIF(order_data->>'shipping_notes', ''), calculated_total, requested_source) RETURNING id INTO new_order_id;
FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
pid := (item->>'product_id')::int; vid := NULLIF(item->>'variation_id', '')::uuid; qty := (item->>'quantity')::int;
IF vid IS NOT NULL THEN
SELECT price, name INTO current_price, vname FROM public.product_variations WHERE id = vid;
UPDATE public.product_variations SET stock = stock - qty WHERE id = vid;
ELSE
SELECT price INTO current_price FROM public.products WHERE id = pid; vname := NULL;
UPDATE public.products SET stock = stock - qty WHERE id = pid;
END IF;
INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, variation_id, variation_name) VALUES (new_order_id, pid, qty, current_price, vid, vname);
END LOOP; RETURN new_order_id; END;
$function$;
CREATE OR REPLACE FUNCTION public.create_owned_order(order_data jsonb, items jsonb, owner_id uuid DEFAULT NULL::uuid, coupon_code text DEFAULT NULL::text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE created_id uuid; cp public.customer_coupons; coupon_text text := NULLIF(btrim(coupon_code), ''); subtotal numeric; discount numeric := 0;
BEGIN
IF coupon_text IS NOT NULL THEN
IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign in to use a coupon'; END IF;
SELECT * INTO cp FROM public.customer_coupons c WHERE c.user_id = owner_id AND upper(c.code) = upper(coupon_text) AND c.used_at IS NULL AND (c.expires_at IS NULL OR c.expires_at > now()) ORDER BY c.expires_at NULLS LAST, c.id LIMIT 1 FOR UPDATE;
IF cp.id IS NULL THEN RAISE EXCEPTION 'Coupon is invalid, expired or already used'; END IF;
IF cp.discount_value <= 0 THEN RAISE EXCEPTION 'Coupon has no discount value'; END IF;
END IF;
created_id := public.create_order_with_items(order_data, items);
IF cp.id IS NOT NULL THEN
SELECT COALESCE(SUM(unit_price * quantity), 0) INTO subtotal FROM public.order_items WHERE order_id = created_id;
IF subtotal < cp.min_order THEN RAISE EXCEPTION 'Order total is below the coupon minimum'; END IF;
discount := LEAST(subtotal, CASE WHEN cp.discount_type = 'percent' THEN round(subtotal * cp.discount_value / 100, 2) ELSE cp.discount_value END);
UPDATE public.orders SET total_amount = subtotal - discount, discount_amount = discount, coupon_id = cp.id WHERE id = created_id;
UPDATE public.customer_coupons SET used_at = now() WHERE id = cp.id;
END IF;
UPDATE public.orders SET user_id = owner_id WHERE id = created_id; RETURN created_id; END;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_variation_limit() RETURNS trigger LANGUAGE plpgsql SET search_path TO public AS $function$
BEGIN IF (SELECT count(*) FROM public.product_variations WHERE product_id = NEW.product_id AND id <> NEW.id) >= 20 THEN RAISE EXCEPTION 'A product can have at most 20 variations'; END IF; RETURN NEW; END;
$function$;

CREATE TRIGGER guard_cancelled_order BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_cancelled_order();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER product_variations_limit BEFORE INSERT ON public.product_variations FOR EACH ROW EXECUTE FUNCTION public.enforce_variation_limit();
CREATE TRIGGER update_product_variations_updated_at BEFORE UPDATE ON public.product_variations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- No non-internal auth.users trigger was observed; create_customer_profile exists but is unattached.
-- Exact observed execution exposure for application functions (security review required).
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC, anon, authenticated, service_role;
-- Platform-only postgres/sandbox_exec table and schema ACLs are documented, not recreated.
-- Bucket metadata (not object data): media, private, file_size_limit=20971520,
-- allowed_mime_types=NULL. Create through storage API; no storage.objects/buckets policies observed.
-- Installed platform extensions: plpgsql(pg_catalog), pg_stat_statements(extensions),
-- uuid-ossp(extensions), pgcrypto(extensions), supabase_vault(vault).
-- Provision extensions via the target platform; modern PostgreSQL supplies gen_random_uuid().

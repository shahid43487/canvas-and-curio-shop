ALTER TABLE public.products ADD COLUMN selector_mode text NOT NULL DEFAULT 'none' CHECK (selector_mode IN ('none','color','pacman'));

CREATE TABLE public.product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text NOT NULL UNIQUE,
  price numeric NOT NULL CHECK (price >= 0),
  compare_at_price numeric,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  bundle_quantity integer NOT NULL DEFAULT 1 CHECK (bundle_quantity >= 1),
  image_key text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  button_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variations_product_idx ON public.product_variations(product_id, display_order);

CREATE OR REPLACE FUNCTION public.enforce_variation_limit() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.product_variations WHERE product_id = NEW.product_id AND id <> NEW.id) >= 20 THEN
    RAISE EXCEPTION 'A product can have at most 20 variations';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER product_variations_limit BEFORE INSERT ON public.product_variations FOR EACH ROW EXECUTE FUNCTION public.enforce_variation_limit();
CREATE TRIGGER update_product_variations_updated_at BEFORE UPDATE ON public.product_variations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.product_variations TO anon, authenticated;
GRANT ALL ON public.product_variations TO service_role;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active variations of visible products" ON public.product_variations FOR SELECT TO anon, authenticated
  USING (is_active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_hidden = false));

ALTER TABLE public.order_items ADD COLUMN variation_id uuid REFERENCES public.product_variations(id);
ALTER TABLE public.order_items ADD COLUMN variation_name text;

CREATE OR REPLACE FUNCTION public.create_order_with_items(order_data jsonb, items jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  new_order_id uuid;
  item jsonb;
  pid int;
  vid uuid;
  vname text;
  qty int;
  available int;
  current_price numeric;
  advance_required boolean;
  hidden_product boolean;
  calculated_total numeric := 0;
  requested_source text := COALESCE(NULLIF(order_data->>'order_source', ''), 'regular');
  requested_payment public.payment_method := (order_data->>'payment_method')::public.payment_method;
BEGIN
  IF jsonb_array_length(items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
  IF requested_source NOT IN ('regular', 'secret') THEN RAISE EXCEPTION 'Invalid order source'; END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
    pid := (item->>'product_id')::int;
    vid := NULLIF(item->>'variation_id', '')::uuid;
    qty := (item->>'quantity')::int;
    IF qty < 1 THEN RAISE EXCEPTION 'Invalid quantity for product %', pid; END IF;

    SELECT stock, price, requires_advance_payment, is_hidden
      INTO available, current_price, advance_required, hidden_product
    FROM public.products WHERE id = pid FOR UPDATE;
    IF available IS NULL THEN RAISE EXCEPTION 'Product % not found', pid; END IF;

    IF vid IS NOT NULL THEN
      available := NULL;
      SELECT stock, price INTO available, current_price FROM public.product_variations
      WHERE id = vid AND product_id = pid AND is_active FOR UPDATE;
      IF available IS NULL THEN RAISE EXCEPTION 'Variation not available'; END IF;
    END IF;

    IF available < qty THEN RAISE EXCEPTION 'Insufficient stock: requested %, available %', qty, available; END IF;
    IF hidden_product <> (requested_source = 'secret') THEN RAISE EXCEPTION 'Regular and secret products cannot be mixed'; END IF;
    IF advance_required AND requested_payment <> 'bkash' THEN RAISE EXCEPTION 'Advance payment is required for this product'; END IF;
    calculated_total := calculated_total + (current_price * qty);
  END LOOP;

  IF requested_payment = 'bkash' AND NULLIF(BTRIM(order_data->>'bkash_transaction_id'), '') IS NULL THEN
    RAISE EXCEPTION 'bKash transaction ID is required';
  END IF;

  INSERT INTO public.orders (
    status, payment_method, payment_status, bkash_transaction_id,
    shipping_name, shipping_email, shipping_phone, shipping_address,
    shipping_city, shipping_notes, total_amount, order_source
  ) VALUES (
    'pending', requested_payment, 'pending',
    NULLIF(BTRIM(order_data->>'bkash_transaction_id'), ''),
    order_data->>'shipping_name', COALESCE(order_data->>'shipping_email', ''),
    order_data->>'shipping_phone', order_data->>'shipping_address',
    order_data->>'shipping_city', NULLIF(order_data->>'shipping_notes', ''),
    calculated_total, requested_source
  ) RETURNING id INTO new_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
    pid := (item->>'product_id')::int;
    vid := NULLIF(item->>'variation_id', '')::uuid;
    qty := (item->>'quantity')::int;
    IF vid IS NOT NULL THEN
      SELECT price, name INTO current_price, vname FROM public.product_variations WHERE id = vid;
      UPDATE public.product_variations SET stock = stock - qty WHERE id = vid;
    ELSE
      SELECT price INTO current_price FROM public.products WHERE id = pid;
      vname := NULL;
      UPDATE public.products SET stock = stock - qty WHERE id = pid;
    END IF;
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, variation_id, variation_name)
    VALUES (new_order_id, pid, qty, current_price, vid, vname);
  END LOOP;

  RETURN new_order_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO service_role;
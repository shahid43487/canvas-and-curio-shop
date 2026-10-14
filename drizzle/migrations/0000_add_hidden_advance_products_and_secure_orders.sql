ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_advance_payment boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_source text NOT NULL DEFAULT 'regular'
    CHECK (order_source IN ('regular', 'secret'));

DROP POLICY IF EXISTS "Product catalog is public" ON public.products;
DROP POLICY IF EXISTS "Public catalog excludes hidden products" ON public.products;
CREATE POLICY "Public catalog excludes hidden products"
ON public.products
FOR SELECT
TO anon
USING (is_hidden = false);

CREATE OR REPLACE FUNCTION public.create_order_with_items(order_data jsonb, items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_order_id uuid;
  item jsonb;
  pid int;
  qty int;
  available int;
  current_price numeric;
  advance_required boolean;
  hidden_product boolean;
  calculated_total numeric := 0;
  requested_source text := COALESCE(NULLIF(order_data->>'order_source', ''), 'regular');
  requested_payment public.payment_method := (order_data->>'payment_method')::public.payment_method;
BEGIN
  IF jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  IF requested_source NOT IN ('regular', 'secret') THEN
    RAISE EXCEPTION 'Invalid order source';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    pid := (item->>'product_id')::int;
    qty := (item->>'quantity')::int;

    IF qty < 1 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', pid;
    END IF;

    SELECT stock, price, requires_advance_payment, is_hidden
      INTO available, current_price, advance_required, hidden_product
    FROM public.products
    WHERE id = pid
    FOR UPDATE;

    IF available IS NULL THEN
      RAISE EXCEPTION 'Product % not found', pid;
    END IF;

    IF available < qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %: requested %, available %', pid, qty, available;
    END IF;

    IF hidden_product <> (requested_source = 'secret') THEN
      RAISE EXCEPTION 'Regular and secret products cannot be mixed';
    END IF;

    IF advance_required AND requested_payment <> 'bkash' THEN
      RAISE EXCEPTION 'Advance payment is required for this product';
    END IF;

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

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    pid := (item->>'product_id')::int;
    qty := (item->>'quantity')::int;
    SELECT price INTO current_price FROM public.products WHERE id = pid;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (new_order_id, pid, qty, current_price);

    UPDATE public.products SET stock = stock - qty WHERE id = pid;
  END LOOP;

  RETURN new_order_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO service_role;
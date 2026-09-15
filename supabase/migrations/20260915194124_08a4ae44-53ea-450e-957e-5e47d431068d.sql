CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('cod', 'bkash');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid');

CREATE TABLE public.products (
  id integer PRIMARY KEY,
  num text NOT NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  color text NOT NULL,
  tag text NOT NULL,
  material text NOT NULL,
  dims text NOT NULL,
  batch text NOT NULL,
  description text NOT NULL,
  colors text[] NOT NULL DEFAULT '{}',
  stock integer NOT NULL DEFAULT 0,
  image_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product catalog is public"
  ON public.products
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  bkash_transaction_id text,
  shipping_name text NOT NULL,
  shipping_email text NOT NULL,
  shipping_phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_notes text,
  total_amount numeric(10,2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.products (id, num, name, price, color, tag, material, dims, batch, description, colors, stock, image_key)
VALUES
  (1, 'STUUF / 001', 'Blob Lamp', 28.00, 'var(--smol-yellow)', 'NEW STUUF', 'PLA + frosted diffuser', '9 × 9 × 14 cm', 'Batch 04 · 32 pcs', 'A small lopsided light that looks like it''s mid-laugh. Warm glow, soft silicone base, plugs into any USB-C brick.', ARRAY['var(--smol-yellow)', 'var(--smol-pink)', 'var(--smol-cyan)'], 32, 'product-blob-lamp'),
  (2, 'STUUF / 002', 'Cork Wobble Tray', 18.00, 'var(--smol-cyan)', 'BEST STUUF', 'Pressed cork sheet', '16 × 10 × 2 cm', 'Batch 03 · 50 pcs', 'An intentionally uneven catch-all tray. Holds keys, rings, the one screw you''re saving for later.', ARRAY['var(--smol-cyan)', '#D9B98A', 'var(--smol-green)'], 50, 'product-cork-tray'),
  (3, 'STUUF / 003', 'Little Guy Hook', 12.00, 'var(--smol-pink)', 'WEIRD ONE', 'PLA, wall-mount', '5 × 5 × 8 cm', 'Batch 04 · 40 pcs', 'A tiny wall creature that holds your headphones so they stop living on the floor. Comes with 2 screws.', ARRAY['var(--smol-pink)', 'var(--smol-purple)', 'var(--smol-ink)'], 40, 'product-little-guy-hook'),
  (4, 'STUUF / 004', 'Stack Rings Organizer', 22.00, 'var(--smol-purple)', 'LIMITED', 'PLA, modular', '12 × 12 × 6 cm', 'Batch 04 · 24 pcs', 'Three wobbly rings that stack any way you like. Desk toy first, organizer second.', ARRAY['var(--smol-purple)', 'var(--smol-yellow)', 'var(--smol-cyan)'], 24, 'product-stack-rings'),
  (5, 'STUUF / 005', 'Sun Coaster Set', 16.00, 'var(--smol-red)', 'NEW STUUF', 'Pressed cork, set of 4', '10 × 10 × 0.5 cm', 'Batch 04 · 36 sets', 'Four coasters, one grumpy little sun graphic. Protects tables, starts conversations.', ARRAY['var(--smol-red)', 'var(--smol-ink)', '#D9B98A'], 36, 'product-sun-coasters'),
  (6, 'STUUF / 006', 'Squiggle Bookend', 24.00, 'var(--smol-green)', 'RESTOCKED', 'PLA, weighted base', '8 × 8 × 15 cm', 'Batch 02 · restock', 'Sold in singles because your books probably don''t match anyway. Heavy enough to actually work.', ARRAY['var(--smol-green)', 'var(--smol-pink)', 'var(--smol-ink)'], 28, 'product-squiggle-bookend');

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  order_data jsonb,
  items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id uuid;
  item jsonb;
  pid int;
  qty int;
  available int;
BEGIN
  INSERT INTO public.orders (
    status,
    payment_method,
    payment_status,
    bkash_transaction_id,
    shipping_name,
    shipping_email,
    shipping_phone,
    shipping_address,
    shipping_city,
    shipping_notes,
    total_amount
  ) VALUES (
    'pending',
    (order_data->>'payment_method')::public.payment_method,
    'pending',
    NULLIF(order_data->>'bkash_transaction_id', ''),
    order_data->>'shipping_name',
    order_data->>'shipping_email',
    order_data->>'shipping_phone',
    order_data->>'shipping_address',
    order_data->>'shipping_city',
    NULLIF(order_data->>'shipping_notes', ''),
    (order_data->>'total_amount')::numeric
  ) RETURNING id INTO new_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    pid := (item->>'product_id')::int;
    qty := (item->>'quantity')::int;

    SELECT stock INTO available FROM public.products WHERE id = pid FOR UPDATE;

    IF available IS NULL THEN
      RAISE EXCEPTION 'Product % not found', pid;
    END IF;

    IF available < qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %: requested %, available %', pid, qty, available;
    END IF;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      new_order_id,
      pid,
      qty,
      (item->>'unit_price')::numeric
    );

    UPDATE public.products SET stock = stock - qty WHERE id = pid;
  END LOOP;

  RETURN new_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO service_role;

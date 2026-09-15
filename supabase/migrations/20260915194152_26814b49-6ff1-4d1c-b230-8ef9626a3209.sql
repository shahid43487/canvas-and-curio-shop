REVOKE EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO service_role;

CREATE POLICY "Orders are service-only"
  ON public.orders
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Order items are service-only"
  ON public.order_items
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE FUNCTION public.create_owned_order(order_data jsonb, items jsonb, owner_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE created_id uuid; BEGIN created_id := public.create_order_with_items(order_data, items); UPDATE public.orders SET user_id = owner_id WHERE id = created_id; RETURN created_id; END; $$;
REVOKE ALL ON FUNCTION public.create_owned_order(jsonb,jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_owned_order(jsonb,jsonb,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb,jsonb) TO service_role;
CREATE POLICY "Customers read visible products" ON public.products FOR SELECT TO authenticated USING (is_hidden = false);
GRANT SELECT ON public.products TO authenticated;
DELETE FROM public.order_items WHERE order_id = 'c11d5350-0e02-4e4e-b315-67e0014969d8';
DELETE FROM public.orders WHERE id = 'c11d5350-0e02-4e4e-b315-67e0014969d8';
UPDATE public.products SET stock = 32 WHERE id = 1;
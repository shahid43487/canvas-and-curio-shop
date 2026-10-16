-- Batch 04: the drop itself.

INSERT INTO public.products
  (id, num, name, price, color, tag, material, dims, batch, description, colors, stock, image_key, is_hidden, requires_advance_payment)
VALUES
  (1, '01', 'Blob Lamp', 48, '#FFD23F', 'LIMITED', 'PLA, cork base, basic hardware', 'H 18 cm · Ø 12 cm', 'Batch 04', 'A stubby little lamp that glows like it is pleased with itself. Printed in small runs, sanded by hand, cork underneath so it never skids off your desk.', ARRAY['#FFD23F','#FF5C8A','#1E1B18'], 6, 'product-blob-lamp', false, false),
  (2, '02', 'Cork Tray', 22, '#C8A87C', 'NEW', 'Cork, cork dust, hand cut', '30 × 18 cm', 'Batch 04', 'The catch-all for keys, coins and whatever else you drop on it. Cut from one cork sheet, edges left honest.', ARRAY['#C8A87C','#F4EDE1'], 14, 'product-cork-tray', false, false),
  (3, '03', 'Little Guy Hook', 14, '#4CC9F0', 'WEIRD ONE', 'PLA, steel pin', 'H 9 cm', 'Batch 04', 'A tiny face that holds your bag up. Mounted on a steel pin, so it actually stays on the wall.', ARRAY['#4CC9F0','#FFD23F','#1E1B18'], 20, 'product-little-guy-hook', false, false),
  (4, '04', 'Stack Rings', 36, '#FF5C8A', 'NEW', 'PLA, cork core', 'Ø 8-14 cm stack', 'Batch 04', 'Three rings that stack into a sculpture or spread out as paperweights. Printed slowly so the lines stay clean.', ARRAY['#FF5C8A','#FFD23F','#4CC9F0'], 9, 'product-stack-rings', false, false),
  (5, '05', 'Sun Coasters', 18, '#FFD23F', 'NEW', 'Cork, PLA top', 'Ø 10 cm each', 'Batch 04', 'Little suns for your glass. Cork underneath, printed on top, wipes clean.', ARRAY['#FFD23F','#FF5C8A'], 24, 'product-sun-coasters', false, false),
  (6, '06', 'Squiggle Bookend', 42, '#7B6CF6', 'LIMITED', 'PLA, cork weight', 'H 15 cm · pair', 'Batch 04', 'A pair of squiggles that keep your books upright and your shelf from looking like everyone else''s.', ARRAY['#7B6CF6','#FFD23F','#1E1B18'], 4, 'product-squiggle-bookend', false, false),
  (101, 'S1', 'Excuse Button', 12, '#FF5C8A', 'SECRET', 'PLA, click switch', 'Ø 6 cm', 'Batch 04', 'Press it, get out of the meeting. Wired to nothing, which is the whole point.', ARRAY['#FF5C8A','#FFD23F'], 8, 'prank-excuse-button', true, true),
  (102, 'S2', 'Spill Coaster', 16, '#4CC9F0', 'SECRET', 'Cork, PLA', 'Ø 11 cm', 'Batch 04', 'Looks exactly like someone already spilled on the desk. Do not put a real glass on it.', ARRAY['#4CC9F0','#F4EDE1'], 10, 'prank-spill-coaster', true, true),
  (103, 'S3', 'Desk Whistle', 9, '#FFD23F', 'SECRET', 'PLA, pea whistle', 'L 7 cm', 'Batch 04', 'A tiny whistle for calling your friends to attention. Loud way beyond its size.', ARRAY['#FFD23F','#1E1B18'], 12, 'prank-desk-whistle', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variations
  (product_id, name, sku, price, compare_at_price, stock, bundle_quantity, image_key, button_config, display_order)
VALUES
  (1, 'Small', 'BLOB-S', 28, NULL, 5, 1, NULL, '{"arrangement":"row","icons":[{"color":"#FFD23F"}]}'::jsonb, 1),
  (1, 'Big', 'BLOB-B', 48, NULL, 6, 1, NULL, '{"arrangement":"row","icons":[{"color":"#FFD23F"},{"color":"#FF5C8A"}]}'::jsonb, 2),
  (1, 'Twin pack', 'BLOB-2', 84, 96, 2, 2, NULL, '{"arrangement":"staggered","icons":[{"color":"#FFD23F"},{"color":"#FFD23F"},{"color":"#FF5C8A"}],"color":"#FFD23F"}'::jsonb, 3),
  (5, 'Set of 2', 'SUN-2', 18, NULL, 24, 2, NULL, '{"arrangement":"compact","icons":[{"color":"#FFD23F"},{"color":"#FF5C8A"}]}'::jsonb, 1),
  (5, 'Set of 4', 'SUN-4', 32, 36, 8, 4, NULL, '{"arrangement":"compact","icons":[{"color":"#FFD23F"},{"color":"#FF5C8A"},{"color":"#4CC9F0"},{"color":"#7B6CF6"}],"color":"#FFD23F"}'::jsonb, 2),
  (6, 'Pair', 'SQD-P', 42, NULL, 4, 2, NULL, '{"arrangement":"row","icons":[{"color":"#7B6CF6"},{"color":"#FFD23F"}]}'::jsonb, 1),
  (6, 'Trio', 'SQD-T', 58, 63, 2, 3, NULL, '{"arrangement":"staggered","icons":[{"color":"#7B6CF6"},{"color":"#FFD23F"},{"color":"#4CC9F0"}],"color":"#7B6CF6"}'::jsonb, 2)
ON CONFLICT (sku) DO NOTHING;

UPDATE public.products SET selector_mode = 'pacman'
WHERE id IN (1, 5, 6) AND selector_mode <> 'pacman';
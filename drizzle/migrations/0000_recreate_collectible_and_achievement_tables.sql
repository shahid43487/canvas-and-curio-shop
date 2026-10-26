CREATE TABLE public.achievement_definitions (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'orders',
  requirement_type text NOT NULL DEFAULT 'delivered_orders',
  requirement_value integer NOT NULL DEFAULT 1,
  reward_discount_type text NOT NULL DEFAULT 'percent',
  reward_discount_value numeric NOT NULL DEFAULT 0,
  rarity text NOT NULL DEFAULT 'common',
  is_secret boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_type text NOT NULL,
  source_id text NOT NULL,
  serial_number text NOT NULL DEFAULT '',
  rarity text NOT NULL DEFAULT 'common',
  acquired_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.customer_achievements (
  user_id uuid NOT NULL,
  achievement_id text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  PRIMARY KEY (user_id, achievement_id)
);

GRANT SELECT ON public.achievement_definitions TO anon, authenticated;
GRANT ALL ON public.achievement_definitions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_cards TO authenticated;
GRANT ALL ON public.customer_cards TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_achievements TO authenticated;
GRANT ALL ON public.customer_achievements TO service_role;

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievement definitions are readable" ON public.achievement_definitions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Members read own cards" ON public.customer_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members read own achievements" ON public.customer_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.achievement_definitions (id, title, description, category, requirement_type, requirement_value, reward_discount_type, reward_discount_value, rarity, is_secret, is_active, sort_order) VALUES
  ('first-drop', 'FIRST DROP', 'Get your first order delivered.', 'orders', 'delivered_orders', 1, 'percent', 10, 'common', false, true, 1),
  ('collector-three', 'COLLECTOR', 'Have 3 orders delivered.', 'orders', 'delivered_orders', 3, 'percent', 15, 'uncommon', false, true, 2),
  ('inner-circle-five', 'INNER CIRCLE', 'Have 5 orders delivered.', 'orders', 'delivered_orders', 5, 'percent', 20, 'rare', false, true, 3),
  ('repeat-legend', 'REPEAT LEGEND', 'Have 10 orders delivered.', 'orders', 'delivered_orders', 10, 'percent', 25, 'epic', false, true, 4),
  ('secret-stuuf', 'THE SECRET STUUF', 'A hidden club milestone.', 'secret', 'delivered_orders', 15, 'percent', 30, 'legendary', true, true, 5);
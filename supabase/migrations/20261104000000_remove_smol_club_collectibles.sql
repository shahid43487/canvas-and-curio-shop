-- Retire the SMOL CLUB card collection, achievement, set and reward system.
-- Historical migrations remain immutable; this forward migration removes the live schema.
DROP TRIGGER IF EXISTS customer_coupon_collectible_insert ON public.customer_coupons;
DROP TRIGGER IF EXISTS orders_refresh_customer_achievements ON public.orders;

DROP FUNCTION IF EXISTS public.capture_coupon_collectible();
DROP FUNCTION IF EXISTS public.refresh_customer_order_achievements();
DROP FUNCTION IF EXISTS public.refresh_club_progress();
DROP FUNCTION IF EXISTS public.claim_club_set(text, text);

DROP TABLE IF EXISTS public.set_reward_claims;
DROP TABLE IF EXISTS public.customer_achievements;
DROP TABLE IF EXISTS public.customer_cards;
DROP TABLE IF EXISTS public.achievement_definitions;
DROP TABLE IF EXISTS public.card_definitions;
DROP TABLE IF EXISTS public.card_sets;

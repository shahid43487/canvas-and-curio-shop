ALTER TABLE public.card_definitions ADD COLUMN IF NOT EXISTS background_url text;
ALTER TABLE public.card_definitions ADD COLUMN IF NOT EXISTS sound_url text;
COMMENT ON COLUMN public.card_definitions.background_url IS 'Custom card background stored in the private media bucket, referenced by signed read URL';
COMMENT ON COLUMN public.card_definitions.sound_url IS 'User-initiated card sound stored in the private media bucket, referenced by signed read URL';
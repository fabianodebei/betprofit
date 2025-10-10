-- Drop tables related to oddsmatcher
DROP TABLE IF EXISTS public.oddsmatcher_history CASCADE;
DROP TABLE IF EXISTS public.user_oddsmatcher_settings CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS public.update_oddsmatcher_settings_updated_at() CASCADE;
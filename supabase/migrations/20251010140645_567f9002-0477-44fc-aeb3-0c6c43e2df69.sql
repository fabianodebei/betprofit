-- Add API key field to user_oddsmatcher_settings table
ALTER TABLE public.user_oddsmatcher_settings 
ADD COLUMN IF NOT EXISTS odds_api_key TEXT;
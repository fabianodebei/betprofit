-- Fix Security Definer issue for user_telegram_config_decrypted view
-- Drop the existing view
DROP VIEW IF EXISTS public.user_telegram_config_decrypted;

-- Recreate the view with security_invoker instead of security_definer
CREATE VIEW public.user_telegram_config_decrypted 
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  decrypt_telegram_credential(telegram_bot_token_encrypted) AS telegram_bot_token,
  decrypt_telegram_credential(telegram_chat_id_encrypted) AS telegram_chat_id,
  notifications_enabled,
  created_at,
  updated_at
FROM public.user_telegram_config;

-- Add RLS policy for the view
ALTER VIEW public.user_telegram_config_decrypted OWNER TO postgres;

-- Grant appropriate permissions
GRANT SELECT ON public.user_telegram_config_decrypted TO authenticated;
GRANT SELECT ON public.user_telegram_config_decrypted TO service_role;
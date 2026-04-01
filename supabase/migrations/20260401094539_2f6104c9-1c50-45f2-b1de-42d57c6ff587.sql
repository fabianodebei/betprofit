
-- 1. Enable RLS on user_roles (CRITICO)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Fix user_telegram_config_decrypted view - recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.user_telegram_config_decrypted;
CREATE VIEW public.user_telegram_config_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  notifications_enabled,
  decrypt_telegram_credential(telegram_bot_token_encrypted) AS telegram_bot_token,
  decrypt_telegram_credential(telegram_chat_id_encrypted) AS telegram_chat_id,
  created_at,
  updated_at
FROM public.user_telegram_config;

-- 3. Fix search_path on handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW()
  );
  RETURN NEW;
END;
$function$;

-- 4. Fix search_path on notify_new_user_registration
CREATE OR REPLACE FUNCTION public.notify_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://api.telegram.org/bot8230017557:AAFfrCx2OTKv2iExNdu9foEBsii9wDjT_Xg/sendMessage',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'chat_id', '77204387',
      'text', '👤 Nuovo utente registrato!' || chr(10) ||
              '📧 Email: ' || NEW.email || chr(10) ||
              '🕐 Data: ' || to_char(NOW(), 'DD/MM/YYYY HH24:MI'),
      'parse_mode', 'HTML'
    )
  );
  RETURN NEW;
END;
$function$;

-- 5. Fix function_rate_limits RLS policies - restrict to service_role only
DROP POLICY IF EXISTS "Service role can delete rate limits" ON public.function_rate_limits;
DROP POLICY IF EXISTS "Service role can insert rate limits" ON public.function_rate_limits;
DROP POLICY IF EXISTS "Service role can read rate limits" ON public.function_rate_limits;
DROP POLICY IF EXISTS "Service role can update rate limits" ON public.function_rate_limits;

CREATE POLICY "Service role can delete rate limits" ON public.function_rate_limits FOR DELETE TO service_role USING (true);
CREATE POLICY "Service role can insert rate limits" ON public.function_rate_limits FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can read rate limits" ON public.function_rate_limits FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role can update rate limits" ON public.function_rate_limits FOR UPDATE TO service_role USING (true);

DROP POLICY IF EXISTS "Admin full access" ON public.profiles;

CREATE POLICY "Admin full access"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view own admin preferences" ON public.admin_preferences;
DROP POLICY IF EXISTS "Users can insert own admin preferences" ON public.admin_preferences;
DROP POLICY IF EXISTS "Users can update own admin preferences" ON public.admin_preferences;
DROP POLICY IF EXISTS "Users can delete own admin preferences" ON public.admin_preferences;

CREATE POLICY "Admins can view own admin preferences"
ON public.admin_preferences
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can insert own admin preferences"
ON public.admin_preferences
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update own admin preferences"
ON public.admin_preferences
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete own admin preferences"
ON public.admin_preferences
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DELETE FROM public.admin_preferences
WHERE NOT public.has_role(user_id, 'admin'::public.app_role);

ALTER TABLE public.user_proxies
  ALTER COLUMN username DROP NOT NULL,
  ALTER COLUMN password DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.scrub_user_proxy_plaintext()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.username IS NOT NULL AND btrim(NEW.username) <> '' THEN
    NEW.username_encrypted = public.encrypt_telegram_credential(btrim(NEW.username));
  END IF;

  IF NEW.password IS NOT NULL AND btrim(NEW.password) <> '' THEN
    NEW.password_encrypted = public.encrypt_telegram_credential(btrim(NEW.password));
  END IF;

  NEW.username = NULL;
  NEW.password = NULL;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS scrub_user_proxy_plaintext_trigger ON public.user_proxies;
CREATE TRIGGER scrub_user_proxy_plaintext_trigger
BEFORE INSERT OR UPDATE ON public.user_proxies
FOR EACH ROW
EXECUTE FUNCTION public.scrub_user_proxy_plaintext();

CREATE OR REPLACE FUNCTION public.scrub_telegram_config_plaintext()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.telegram_bot_token IS NOT NULL AND btrim(NEW.telegram_bot_token) <> '' THEN
    NEW.telegram_bot_token_encrypted = public.encrypt_telegram_credential(btrim(NEW.telegram_bot_token));
  END IF;

  IF NEW.telegram_chat_id IS NOT NULL AND btrim(NEW.telegram_chat_id) <> '' THEN
    NEW.telegram_chat_id_encrypted = public.encrypt_telegram_credential(btrim(NEW.telegram_chat_id));
  END IF;

  NEW.telegram_bot_token = NULL;
  NEW.telegram_chat_id = NULL;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS scrub_telegram_config_plaintext_trigger ON public.user_telegram_config;
CREATE TRIGGER scrub_telegram_config_plaintext_trigger
BEFORE INSERT OR UPDATE ON public.user_telegram_config
FOR EACH ROW
EXECUTE FUNCTION public.scrub_telegram_config_plaintext();

UPDATE public.user_proxies
SET
  username_encrypted = COALESCE(username_encrypted, public.encrypt_telegram_credential(username)),
  password_encrypted = COALESCE(password_encrypted, public.encrypt_telegram_credential(password)),
  username = NULL,
  password = NULL
WHERE username IS NOT NULL OR password IS NOT NULL;

UPDATE public.user_telegram_config
SET
  telegram_bot_token_encrypted = COALESCE(telegram_bot_token_encrypted, public.encrypt_telegram_credential(telegram_bot_token)),
  telegram_chat_id_encrypted = COALESCE(telegram_chat_id_encrypted, public.encrypt_telegram_credential(telegram_chat_id)),
  telegram_bot_token = NULL,
  telegram_chat_id = NULL
WHERE telegram_bot_token IS NOT NULL OR telegram_chat_id IS NOT NULL;
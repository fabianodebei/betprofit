
-- 1. Add encrypted columns
ALTER TABLE public.user_proxies
  ADD COLUMN IF NOT EXISTS username_encrypted bytea,
  ADD COLUMN IF NOT EXISTS password_encrypted bytea;

-- 2. Migrate existing plaintext data to encrypted columns
UPDATE public.user_proxies
SET
  username_encrypted = encrypt_telegram_credential(username),
  password_encrypted = encrypt_telegram_credential(password)
WHERE username_encrypted IS NULL AND password_encrypted IS NULL;

-- 3. Create decrypted view with SECURITY INVOKER
CREATE OR REPLACE VIEW public.user_proxies_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  proxy_host,
  http_port,
  socks5_port,
  decrypt_telegram_credential(username_encrypted) AS username,
  decrypt_telegram_credential(password_encrypted) AS password,
  rotation_url,
  created_at,
  updated_at
FROM public.user_proxies;

-- 4. Create admin RPC to upsert proxy with encryption
CREATE OR REPLACE FUNCTION public.admin_upsert_proxy(
  p_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_proxy_host text DEFAULT NULL,
  p_http_port integer DEFAULT NULL,
  p_socks5_port integer DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_rotation_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result_id uuid;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  IF p_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.user_proxies SET
      proxy_host = COALESCE(p_proxy_host, proxy_host),
      http_port = COALESCE(p_http_port, http_port),
      socks5_port = COALESCE(p_socks5_port, socks5_port),
      username = COALESCE(p_username, username),
      password = COALESCE(p_password, password),
      username_encrypted = CASE WHEN p_username IS NOT NULL THEN encrypt_telegram_credential(p_username) ELSE username_encrypted END,
      password_encrypted = CASE WHEN p_password IS NOT NULL THEN encrypt_telegram_credential(p_password) ELSE password_encrypted END,
      rotation_url = p_rotation_url,
      updated_at = now()
    WHERE id = p_id
    RETURNING id INTO result_id;
  ELSE
    -- Insert new
    INSERT INTO public.user_proxies (
      user_id, proxy_host, http_port, socks5_port,
      username, password, username_encrypted, password_encrypted, rotation_url
    ) VALUES (
      p_user_id, p_proxy_host, p_http_port, p_socks5_port,
      p_username, p_password,
      encrypt_telegram_credential(p_username),
      encrypt_telegram_credential(p_password),
      p_rotation_url
    )
    RETURNING id INTO result_id;
  END IF;

  RETURN result_id;
END;
$function$;

-- 5. Create admin delete proxy function
CREATE OR REPLACE FUNCTION public.admin_delete_proxy(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  DELETE FROM public.user_proxies WHERE id = p_id;
END;
$function$;

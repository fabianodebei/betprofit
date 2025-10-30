-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns to user_telegram_config
ALTER TABLE public.user_telegram_config 
ADD COLUMN IF NOT EXISTS telegram_bot_token_encrypted bytea,
ADD COLUMN IF NOT EXISTS telegram_chat_id_encrypted bytea;

-- Create function to encrypt telegram credentials using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_telegram_credential(credential text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  encryption_key text := 'tg_encrypt_key_2025_v1'; -- In production, use Vault secret
BEGIN
  IF credential IS NULL OR credential = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use encrypt function with AES algorithm
  RETURN extensions.encrypt(
    credential::bytea,
    encryption_key::bytea,
    'aes'
  );
END;
$$;

-- Create function to decrypt telegram credentials
CREATE OR REPLACE FUNCTION public.decrypt_telegram_credential(encrypted_credential bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  encryption_key text := 'tg_encrypt_key_2025_v1'; -- In production, use Vault secret
BEGIN
  IF encrypted_credential IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt using the same key
  RETURN convert_from(
    extensions.decrypt(
      encrypted_credential,
      encryption_key::bytea,
      'aes'
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails
    RETURN NULL;
END;
$$;

-- Migrate existing plaintext credentials to encrypted format
UPDATE public.user_telegram_config
SET 
  telegram_bot_token_encrypted = public.encrypt_telegram_credential(telegram_bot_token),
  telegram_chat_id_encrypted = public.encrypt_telegram_credential(telegram_chat_id)
WHERE telegram_bot_token IS NOT NULL OR telegram_chat_id IS NOT NULL;

-- Create a secure view that provides decrypted access (service role only)
CREATE OR REPLACE VIEW public.user_telegram_config_decrypted AS
SELECT 
  id,
  user_id,
  public.decrypt_telegram_credential(telegram_bot_token_encrypted) as telegram_bot_token,
  public.decrypt_telegram_credential(telegram_chat_id_encrypted) as telegram_chat_id,
  notifications_enabled,
  created_at,
  updated_at
FROM public.user_telegram_config;

-- Restrict view access to service role only
REVOKE ALL ON public.user_telegram_config_decrypted FROM PUBLIC;
GRANT SELECT ON public.user_telegram_config_decrypted TO service_role;

-- Add helpful comments
COMMENT ON COLUMN public.user_telegram_config.telegram_bot_token_encrypted IS 'Encrypted Telegram bot token using pgcrypto AES';
COMMENT ON COLUMN public.user_telegram_config.telegram_chat_id_encrypted IS 'Encrypted Telegram chat ID using pgcrypto AES';
COMMENT ON VIEW public.user_telegram_config_decrypted IS 'Decrypted Telegram credentials view - service role access only for edge functions';
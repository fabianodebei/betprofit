-- Update encrypt function to use Vault secret instead of hardcoded key
CREATE OR REPLACE FUNCTION public.encrypt_telegram_credential(credential text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'vault'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF credential IS NULL OR credential = '' THEN
    RETURN NULL;
  END IF;
  
  -- Retrieve encryption key from Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'TELEGRAM_ENCRYPTION_KEY'
  LIMIT 1;
  
  -- Fallback to default key if Vault secret not found (for backwards compatibility during migration)
  IF encryption_key IS NULL THEN
    encryption_key := 'tg_encrypt_key_2025_v1';
  END IF;
  
  -- Use encrypt function with AES algorithm
  RETURN extensions.encrypt(
    credential::bytea,
    encryption_key::bytea,
    'aes'
  );
END;
$$;

-- Update decrypt function to use Vault secret instead of hardcoded key
CREATE OR REPLACE FUNCTION public.decrypt_telegram_credential(encrypted_credential bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'vault'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_credential IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Retrieve encryption key from Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'TELEGRAM_ENCRYPTION_KEY'
  LIMIT 1;
  
  -- Fallback to default key if Vault secret not found (for backwards compatibility)
  IF encryption_key IS NULL THEN
    encryption_key := 'tg_encrypt_key_2025_v1';
  END IF;
  
  -- Decrypt using the key
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

-- Revoke public execute permissions on encryption functions for additional security
REVOKE EXECUTE ON FUNCTION public.encrypt_telegram_credential(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_telegram_credential(bytea) FROM PUBLIC;

-- Grant execute only to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.encrypt_telegram_credential(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_telegram_credential(bytea) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION public.encrypt_telegram_credential IS 'Encrypts Telegram credentials using AES with key from Vault (TELEGRAM_ENCRYPTION_KEY)';
COMMENT ON FUNCTION public.decrypt_telegram_credential IS 'Decrypts Telegram credentials using AES with key from Vault (TELEGRAM_ENCRYPTION_KEY) - service_role only';
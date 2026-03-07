-- Fix decrypt_telegram_credential to properly handle AES padding (trailing null bytes)
CREATE OR REPLACE FUNCTION public.decrypt_telegram_credential(encrypted_credential bytea)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  encryption_key text;
  decrypted_bytes bytea;
  result text;
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
  decrypted_bytes := extensions.decrypt(
    encrypted_credential,
    encryption_key::bytea,
    'aes'
  );
  
  -- Convert to text and remove trailing null bytes (AES padding artifacts)
  result := convert_from(decrypted_bytes, 'UTF8');
  result := rtrim(result, chr(0));
  result := rtrim(result);
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails
    RETURN NULL;
END;
$function$;
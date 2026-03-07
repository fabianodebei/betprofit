CREATE OR REPLACE FUNCTION public.decrypt_telegram_credential(encrypted_credential bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  vault_key text;
  decrypted_bytes bytea;
  result text;
BEGIN
  IF encrypted_credential IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1) Try decrypt with key from Vault (current key)
  SELECT decrypted_secret INTO vault_key
  FROM vault.decrypted_secrets
  WHERE name = 'TELEGRAM_ENCRYPTION_KEY'
  LIMIT 1;

  IF vault_key IS NOT NULL THEN
    BEGIN
      decrypted_bytes := extensions.decrypt(
        encrypted_credential,
        vault_key::bytea,
        'aes'
      );

      result := convert_from(decrypted_bytes, 'UTF8');
      result := rtrim(result, chr(0));
      result := btrim(result);
      RETURN result;
    EXCEPTION
      WHEN OTHERS THEN
        -- continue to legacy fallback key
        NULL;
    END;
  END IF;

  -- 2) Fallback for legacy records encrypted with historical default key
  BEGIN
    decrypted_bytes := extensions.decrypt(
      encrypted_credential,
      'tg_encrypt_key_2025_v1'::bytea,
      'aes'
    );

    result := convert_from(decrypted_bytes, 'UTF8');
    result := rtrim(result, chr(0));
    result := btrim(result);
    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$function$;
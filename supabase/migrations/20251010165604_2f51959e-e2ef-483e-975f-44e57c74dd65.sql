-- Fix search path for validate_telegram_message function
CREATE OR REPLACE FUNCTION validate_telegram_message(message text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check message is not empty
  IF message IS NULL OR trim(message) = '' THEN
    RETURN false;
  END IF;
  
  -- Check message length (Telegram limit is 4096 characters)
  IF length(message) > 4096 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;
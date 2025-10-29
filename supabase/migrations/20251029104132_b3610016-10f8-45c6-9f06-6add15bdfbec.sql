-- Drop and recreate the cron function with HMAC secret from Supabase Vault
DROP FUNCTION IF EXISTS public.trigger_notification_check();

-- Create function that calls check-notifications with HMAC secret
CREATE OR REPLACE FUNCTION public.trigger_notification_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  hmac_secret text;
BEGIN
  -- Try to get HMAC secret from Supabase Vault
  BEGIN
    SELECT decrypted_secret INTO hmac_secret
    FROM vault.decrypted_secrets
    WHERE name = 'NOTIFICATION_HMAC_SECRET'
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      -- If vault access fails, proceed without signature
      hmac_secret := NULL;
  END;

  -- Call the edge function
  IF hmac_secret IS NOT NULL THEN
    -- Call with HMAC signature
    PERFORM net.http_post(
      url := 'https://kykcanyioyzqctagrhud.supabase.co/functions/v1/check-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-notification-signature', hmac_secret
      ),
      body := '{}'::jsonb
    );
  ELSE
    -- Call without signature (function will allow if HMAC not configured)
    PERFORM net.http_post(
      url := 'https://kykcanyioyzqctagrhud.supabase.co/functions/v1/check-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  END IF;
  
  RAISE LOG 'Notification check triggered';
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error triggering notification check: %', SQLERRM;
END;
$$;

-- Verify the cron job is scheduled (re-schedule if needed)
SELECT cron.unschedule('check-notifications-every-minute');
SELECT cron.schedule(
  'check-notifications-every-minute',
  '* * * * *',
  $$SELECT public.trigger_notification_check()$$
);
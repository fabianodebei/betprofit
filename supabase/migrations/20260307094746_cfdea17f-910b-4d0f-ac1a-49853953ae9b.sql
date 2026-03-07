
-- Remove old cron jobs pointing to wrong project
SELECT cron.unschedule(1);
SELECT cron.unschedule(3);
SELECT cron.unschedule(10);

-- Update trigger_notification_check function with correct URL
CREATE OR REPLACE FUNCTION public.trigger_notification_check()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  hmac_secret text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO hmac_secret
    FROM vault.decrypted_secrets
    WHERE name = 'NOTIFICATION_HMAC_SECRET'
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      hmac_secret := NULL;
  END;

  IF hmac_secret IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://olmkgsvzpvyherlvokmz.supabase.co/functions/v1/check-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-notification-signature', hmac_secret
      ),
      body := '{}'::jsonb
    );
  ELSE
    PERFORM net.http_post(
      url := 'https://olmkgsvzpvyherlvokmz.supabase.co/functions/v1/check-notifications',
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
$function$;

-- Create new cron job with correct function call (every minute)
SELECT cron.schedule(
  'check-notifications-cron',
  '* * * * *',
  'SELECT public.trigger_notification_check()'
);

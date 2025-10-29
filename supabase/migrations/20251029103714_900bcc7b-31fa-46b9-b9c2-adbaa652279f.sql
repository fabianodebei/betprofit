-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call check-notifications edge function with proper HMAC signature
CREATE OR REPLACE FUNCTION public.trigger_notification_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  hmac_secret text;
  body_content text;
  signature text;
BEGIN
  -- Get the HMAC secret from vault (Supabase secrets)
  hmac_secret := current_setting('app.settings.notification_hmac_secret', true);
  
  -- If secret is not available, try to get it from environment
  IF hmac_secret IS NULL OR hmac_secret = '' THEN
    RAISE NOTICE 'HMAC secret not configured in app settings';
    RETURN;
  END IF;

  -- Empty body for the check
  body_content := '{}';
  
  -- Generate HMAC signature
  signature := encode(
    hmac(body_content::bytea, hmac_secret::bytea, 'sha256'),
    'hex'
  );

  -- Call the edge function with proper authentication
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/check-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true),
      'x-notification-signature', signature
    ),
    body := jsonb_build_object()
  );
  
  RAISE NOTICE 'Notification check triggered successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error triggering notification check: %', SQLERRM;
END;
$$;

-- Schedule the function to run every minute using pg_cron
-- Note: pg_cron uses UTC timezone
SELECT cron.schedule(
  'check-notifications-every-minute',
  '* * * * *',  -- Every minute
  $$SELECT public.trigger_notification_check()$$
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
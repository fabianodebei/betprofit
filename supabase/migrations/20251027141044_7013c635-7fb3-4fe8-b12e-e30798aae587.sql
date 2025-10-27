-- Unschedule old cron job if exists
DO $$
BEGIN
  PERFORM cron.unschedule('check-notifications-every-minute');
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create cron job with NOTIFICATION_HMAC_SECRET
SELECT cron.schedule(
  'check-notifications-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kykcanyioyzqctagrhud.supabase.co/functions/v1/check-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.notification_hmac_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
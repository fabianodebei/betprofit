-- Unschedule old cron job
DO $$
BEGIN
  PERFORM cron.unschedule('check-notifications-every-minute');
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create simplified cron job (function is now public with rate limiting)
SELECT cron.schedule(
  'check-notifications-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kykcanyioyzqctagrhud.supabase.co/functions/v1/check-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
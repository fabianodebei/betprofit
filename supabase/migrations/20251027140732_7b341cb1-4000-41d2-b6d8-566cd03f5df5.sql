-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to check notifications every minute
SELECT cron.schedule(
  'check-notifications-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kykcanyioyzqctagrhud.supabase.co/functions/v1/check-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
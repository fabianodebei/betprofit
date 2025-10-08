-- Ensure required extensions
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule the check-notifications function every minute (idempotent by using a unique name)
-- If a job with this name already exists, you can remove it manually later if needed
select cron.schedule(
  'check-notifications-every-minute-v2',
  '* * * * *',
  $$
  select
    net.http_post(
        url:='https://kykcanyioyzqctagrhud.supabase.co/functions/v1/check-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5a2Nhbnlpb3l6cWN0YWdyaHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzIwOTUsImV4cCI6MjA3NTIwODA5NX0.5EB2NRY45e6NwFGtvU6B6t0d5JRWoKyp2lbMeaW7wWE"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

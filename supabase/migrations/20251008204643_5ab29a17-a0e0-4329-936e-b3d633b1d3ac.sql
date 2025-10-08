-- Configure cron job to check notifications every 15 minutes
SELECT cron.schedule(
  'check-notifications-every-15-minutes',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://kykcanyioyzqctagrhud.supabase.co/functions/v1/check-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5a2Nhbnlpb3l6cWN0YWdyaHVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzMjA5NSwiZXhwIjoyMDc1MjA4MDk1fQ.yyOYGwS0Tz9FGNTHBhVBP8aPdWZp5pKwQ9v1WnVVT_0"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
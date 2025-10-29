-- Drop existing cron job if exists
SELECT cron.unschedule('check-notifications-every-minute');

-- Drop the old function
DROP FUNCTION IF EXISTS public.trigger_notification_check();

-- Create simplified function to call check-notifications
CREATE OR REPLACE FUNCTION public.trigger_notification_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Call the edge function with service role authentication
  -- Using pg_net extension which is available in Supabase
  PERFORM net.http_post(
    url := 'https://kykcanyioyzqctagrhud.supabase.co/functions/v1/check-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claim.sub', true)
    ),
    body := '{}'::jsonb
  );
  
  RAISE LOG 'Notification check triggered';
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error triggering notification check: %', SQLERRM;
END;
$$;

-- Schedule to run every minute
SELECT cron.schedule(
  'check-notifications-every-minute',
  '* * * * *',
  $$SELECT public.trigger_notification_check()$$
);
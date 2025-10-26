-- Update function to use extensions schema for pg_net
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  notification_message TEXT;
BEGIN
  -- Build notification message
  notification_message := '🎉 Nuovo utente registrato!' || E'\n\n' ||
                         '👤 Nome: ' || COALESCE(NEW.raw_user_meta_data->>'full_name', 'N/A') || E'\n' ||
                         '📧 Email: ' || NEW.email || E'\n' ||
                         '📅 Data: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI');

  -- Loop through all admins with Telegram notifications enabled
  FOR admin_record IN
    SELECT 
      utc.user_id,
      utc.telegram_bot_token,
      utc.telegram_chat_id
    FROM public.user_telegram_config utc
    INNER JOIN public.user_roles ur ON utc.user_id = ur.user_id
    WHERE ur.role = 'admin'
      AND utc.notifications_enabled = true
      AND utc.telegram_bot_token IS NOT NULL
      AND utc.telegram_chat_id IS NOT NULL
  LOOP
    -- Send Telegram notification using pg_net from extensions schema
    PERFORM extensions.net.http_post(
      url := 'https://api.telegram.org/bot' || admin_record.telegram_bot_token || '/sendMessage',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'chat_id', admin_record.telegram_chat_id,
        'text', notification_message,
        'parse_mode', 'HTML'
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;
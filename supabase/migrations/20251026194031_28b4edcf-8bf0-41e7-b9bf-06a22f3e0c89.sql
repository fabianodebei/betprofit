-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to notify admins of new user registration
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
    -- Send Telegram notification using pg_net
    PERFORM net.http_post(
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

-- Create trigger to notify admins after new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_notify_admins ON auth.users;
CREATE TRIGGER on_auth_user_created_notify_admins
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_user();
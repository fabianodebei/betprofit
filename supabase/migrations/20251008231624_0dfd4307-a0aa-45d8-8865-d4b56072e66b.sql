-- Create table for user telegram configurations
CREATE TABLE public.user_telegram_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_telegram_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own telegram config"
  ON public.user_telegram_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram config"
  ON public.user_telegram_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram config"
  ON public.user_telegram_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram config"
  ON public.user_telegram_config FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_telegram_config_user_id ON public.user_telegram_config(user_id);

-- Service role policy for edge functions to read all configs
CREATE POLICY "Service role can read all telegram configs"
  ON public.user_telegram_config FOR SELECT
  TO service_role
  USING (true);
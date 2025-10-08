-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create notification_logs table to prevent duplicate notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('reminder', 'bet')),
  reference_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(type, reference_id)
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage logs
CREATE POLICY "Service role can manage notification logs"
ON public.notification_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
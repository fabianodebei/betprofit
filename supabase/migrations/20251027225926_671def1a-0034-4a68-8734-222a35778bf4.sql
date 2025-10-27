-- Create table for distributed rate limiting state
CREATE TABLE IF NOT EXISTS public.function_rate_limits (
  id TEXT PRIMARY KEY,
  last_execution_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_function_rate_limits_last_execution 
ON public.function_rate_limits(last_execution_at);

-- Insert initial state for check-notifications function
INSERT INTO public.function_rate_limits (id, last_execution_at)
VALUES ('check-notifications', now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Create function to update rate limit state atomically
CREATE OR REPLACE FUNCTION public.try_acquire_rate_limit(
  function_id TEXT,
  rate_limit_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  last_exec TIMESTAMP WITH TIME ZONE;
  now_ts TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Lock the row to prevent race conditions
  SELECT last_execution_at INTO last_exec
  FROM public.function_rate_limits
  WHERE id = function_id
  FOR UPDATE;
  
  -- Check if enough time has passed
  IF last_exec IS NULL OR (EXTRACT(EPOCH FROM (now_ts - last_exec)) >= rate_limit_seconds) THEN
    -- Update the timestamp
    UPDATE public.function_rate_limits
    SET last_execution_at = now_ts,
        updated_at = now_ts
    WHERE id = function_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;
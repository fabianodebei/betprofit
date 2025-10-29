-- Add RLS policies for function_rate_limits table
-- This table is only accessed by service role through edge functions

-- Service role can read rate limits
CREATE POLICY "Service role can read rate limits"
  ON public.function_rate_limits
  FOR SELECT
  USING (true);

-- Service role can insert rate limits
CREATE POLICY "Service role can insert rate limits"
  ON public.function_rate_limits
  FOR INSERT
  WITH CHECK (true);

-- Service role can update rate limits
CREATE POLICY "Service role can update rate limits"
  ON public.function_rate_limits
  FOR UPDATE
  USING (true);

-- Service role can delete rate limits (for cleanup)
CREATE POLICY "Service role can delete rate limits"
  ON public.function_rate_limits
  FOR DELETE
  USING (true);
-- Add RLS policy for function_rate_limits table
-- This table is internal and should only be accessed by the service role
-- We create a restrictive policy that effectively prevents all user access

CREATE POLICY "Only service role can access function_rate_limits"
  ON public.function_rate_limits
  FOR ALL
  USING (false)  -- No regular users can access
  WITH CHECK (false);  -- No regular users can modify

-- Note: Edge functions using service role key bypass RLS policies,
-- so this policy only affects regular authenticated users
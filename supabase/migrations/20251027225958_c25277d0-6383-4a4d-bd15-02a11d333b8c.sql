-- Enable RLS on function_rate_limits table
-- This table is only accessed by edge functions using service role key
-- No policies needed as it's an internal system table
ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;
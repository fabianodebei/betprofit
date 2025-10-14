-- Create function to get total earnings per user for admin panel
CREATE OR REPLACE FUNCTION public.admin_get_user_earnings()
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  total_earnings numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    COALESCE(SUM(b.risultato), 0) as total_earnings
  FROM profiles p
  LEFT JOIN bets b ON p.id = b.user_id AND b.stato = 'Archiviata'
  GROUP BY p.id, p.email, p.full_name
  ORDER BY total_earnings DESC;
END;
$$;
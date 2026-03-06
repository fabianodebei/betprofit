CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.created_at,
        COALESCE(ur.role, 'free') as role
      FROM auth.users u
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      ORDER BY u.created_at DESC
    ) t
  );
END;
$$;
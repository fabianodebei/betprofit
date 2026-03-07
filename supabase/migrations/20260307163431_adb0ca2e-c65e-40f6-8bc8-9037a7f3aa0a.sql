
-- Fix has_role to cast text column to app_role for comparison
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role::app_role = _role
  )
$function$;

-- Fix admin_get_user_activities to cast role properly
CREATE OR REPLACE FUNCTION public.admin_get_user_activities()
 RETURNS TABLE(id uuid, email text, full_name text, role app_role, created_at timestamp with time zone, bet_count bigint, transaction_count bigint, account_count bigint, wallet_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role::app_role = 'admin'::app_role
  ) then
    raise exception 'Access denied: admin role required';
  end if;
  
  return query
  select 
    p.id,
    p.email,
    p.full_name,
    COALESCE(ur.role::app_role, 'free'::app_role) as role,
    p.created_at,
    (select count(*) from bets where bets.user_id = p.id) as bet_count,
    (select count(*) from transactions where transactions.user_id = p.id) as transaction_count,
    (select count(*) from accounts where accounts.user_id = p.id) as account_count,
    (select count(*) from wallets where wallets.user_id = p.id) as wallet_count
  from profiles p
  left join user_roles ur on p.id = ur.user_id
  order by p.created_at desc;
end;
$function$;

-- Fix admin_get_user_earnings
CREATE OR REPLACE FUNCTION public.admin_get_user_earnings()
 RETURNS TABLE(user_id uuid, email text, full_name text, total_earnings numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND role::app_role = 'admin'::app_role
  ) THEN
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
$function$;

-- Fix admin_get_registration_data
CREATE OR REPLACE FUNCTION public.admin_get_registration_data()
 RETURNS TABLE(date date, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid() and role::app_role = 'admin'::app_role
  ) then
    raise exception 'Access denied: admin role required';
  end if;
  
  return query
  select 
    date_trunc('day', p.created_at)::date as date,
    count(*) as count
  from profiles p
  where p.created_at >= now() - interval '30 days'
  group by date_trunc('day', p.created_at)
  order by date;
end;
$function$;

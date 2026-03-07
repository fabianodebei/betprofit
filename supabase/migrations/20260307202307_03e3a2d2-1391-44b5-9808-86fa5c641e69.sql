
CREATE OR REPLACE FUNCTION public.admin_get_user_activities()
 RETURNS TABLE(id uuid, email text, full_name text, role app_role, created_at timestamp with time zone, bet_count bigint, transaction_count bigint, account_count bigint, wallet_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from public.user_roles
    where user_roles.user_id = auth.uid() and user_roles.role::app_role = 'admin'::app_role
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

-- Create RPC function for admin stats (server-side validation)
create or replace function public.get_admin_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  -- Verify caller is admin
  if not has_role(auth.uid(), 'admin') then
    raise exception 'Access denied: admin role required';
  end if;
  
  -- Aggregate stats securely
  select json_build_object(
    'totalUsers', (select count(*) from profiles),
    'newUsersLast30Days', (
      select count(*) from profiles 
      where created_at >= now() - interval '30 days'
    ),
    'activeUsersLast30Days', (
      select count(distinct user_id) from bets 
      where created_at >= now() - interval '30 days'
    ),
    'totalBets', (select count(*) from bets),
    'totalTransactions', (select count(*) from transactions),
    'totalAccounts', (select count(*) from accounts),
    'totalWallets', (select count(*) from wallets),
    'totalTags', (select count(*) from tags)
  ) into result;
  
  return result;
end;
$$;

-- Create RPC function for fetching all users with roles (admin only)
create or replace function public.admin_get_all_users()
returns table (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  role app_role
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify caller is admin
  if not has_role(auth.uid(), 'admin') then
    raise exception 'Access denied: admin role required';
  end if;
  
  return query
  select 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    ur.role
  from profiles p
  left join user_roles ur on p.id = ur.user_id
  order by p.created_at desc;
end;
$$;

-- Create RPC function for updating user roles (admin only)
create or replace function public.admin_update_user_role(
  target_user_id uuid,
  new_role app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify caller is admin
  if not has_role(auth.uid(), 'admin') then
    raise exception 'Access denied: admin role required';
  end if;
  
  -- Prevent removing last admin
  if new_role != 'admin' then
    if (select count(*) from user_roles where role = 'admin') = 1 then
      if exists (select 1 from user_roles where user_id = target_user_id and role = 'admin') then
        raise exception 'Cannot remove the last admin user';
      end if;
    end if;
  end if;
  
  -- Update role
  update user_roles 
  set role = new_role 
  where user_id = target_user_id;
end;
$$;

-- Create RPC function for user activities (admin only)
create or replace function public.admin_get_user_activities()
returns table (
  id uuid,
  email text,
  full_name text,
  role app_role,
  created_at timestamptz,
  bet_count bigint,
  transaction_count bigint,
  account_count bigint,
  wallet_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify caller is admin
  if not has_role(auth.uid(), 'admin') then
    raise exception 'Access denied: admin role required';
  end if;
  
  return query
  select 
    p.id,
    p.email,
    p.full_name,
    ur.role,
    p.created_at,
    (select count(*) from bets where user_id = p.id) as bet_count,
    (select count(*) from transactions where user_id = p.id) as transaction_count,
    (select count(*) from accounts where user_id = p.id) as account_count,
    (select count(*) from wallets where user_id = p.id) as wallet_count
  from profiles p
  left join user_roles ur on p.id = ur.user_id
  order by p.created_at desc;
end;
$$;

-- Create RPC function for registration trend data (admin only)
create or replace function public.admin_get_registration_data()
returns table (
  date date,
  count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify caller is admin
  if not has_role(auth.uid(), 'admin') then
    raise exception 'Access denied: admin role required';
  end if;
  
  return query
  select 
    date_trunc('day', created_at)::date as date,
    count(*) as count
  from profiles
  where created_at >= now() - interval '30 days'
  group by date_trunc('day', created_at)
  order by date;
end;
$$;

-- Add Telegram token format validation constraints
alter table user_telegram_config 
add constraint telegram_bot_token_format 
check (
  telegram_bot_token is null 
  or telegram_bot_token = '' 
  or telegram_bot_token ~ '^\d+:[A-Za-z0-9_-]{35,}$'
);

alter table user_telegram_config
add constraint telegram_chat_id_format
check (
  telegram_chat_id is null 
  or telegram_chat_id = '' 
  or telegram_chat_id ~ '^-?\d+$'
);
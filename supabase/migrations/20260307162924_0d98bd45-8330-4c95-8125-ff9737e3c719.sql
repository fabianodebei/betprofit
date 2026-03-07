
CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT json_build_object(
  'totalUsers', COALESCE((SELECT COUNT(*) FROM auth.users), 0),
  'totalAdmins', COALESCE((SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'), 0),
  'totalBets', COALESCE((SELECT COUNT(*) FROM public.bets), 0),
  'totalTransactions', COALESCE((SELECT COUNT(*) FROM public.transactions), 0),
  'totalAccounts', COALESCE((SELECT COUNT(*) FROM public.accounts), 0),
  'totalWallets', COALESCE((SELECT COUNT(*) FROM public.wallets), 0),
  'totalTags', COALESCE((SELECT COUNT(*) FROM public.tags), 0),
  'newUsersLast30Days', COALESCE((SELECT COUNT(*) FROM auth.users WHERE created_at >= now() - interval '30 days'), 0),
  'activeUsersLast30Days', COALESCE((SELECT COUNT(DISTINCT user_id) FROM public.bets WHERE created_at >= now() - interval '30 days'), 0)
);
$function$;


CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT json_build_object(
  'totalUsers', COALESCE((SELECT COUNT(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin')), 0),
  'totalAdmins', COALESCE((SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'), 0),
  'totalBets', COALESCE((SELECT COUNT(*) FROM public.bets b WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = b.user_id AND ur.role = 'admin')), 0),
  'totalTransactions', COALESCE((SELECT COUNT(*) FROM public.transactions t WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = t.user_id AND ur.role = 'admin')), 0),
  'totalAccounts', COALESCE((SELECT COUNT(*) FROM public.accounts a WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = a.user_id AND ur.role = 'admin')), 0),
  'totalWallets', COALESCE((SELECT COUNT(*) FROM public.wallets w WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = w.user_id AND ur.role = 'admin')), 0),
  'totalTags', COALESCE((SELECT COUNT(*) FROM public.tags tg WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = tg.user_id AND ur.role = 'admin')), 0),
  'newUsersLast30Days', COALESCE((SELECT COUNT(*) FROM auth.users u WHERE u.created_at >= now() - interval '30 days' AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin')), 0),
  'activeUsersLast30Days', COALESCE((SELECT COUNT(DISTINCT b2.user_id) FROM public.bets b2 WHERE b2.created_at >= now() - interval '30 days' AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = b2.user_id AND ur.role = 'admin')), 0)
);
$function$;

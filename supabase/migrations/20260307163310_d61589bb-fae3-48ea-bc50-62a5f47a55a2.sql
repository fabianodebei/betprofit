
CREATE OR REPLACE FUNCTION public.admin_update_user_role(new_role text, target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = new_role::app_role;
END;
$function$;

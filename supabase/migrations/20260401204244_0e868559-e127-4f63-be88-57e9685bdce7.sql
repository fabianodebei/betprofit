-- 1. Block all writes on user_roles for non-service-role
CREATE POLICY "Deny public insert on user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny public update on user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny public delete on user_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- 2. Profiles: only the trigger (service_role) can insert
CREATE POLICY "Only service role can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false);
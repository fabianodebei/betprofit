-- ============================================
-- SECURITY FIX: P0 & P1 Vulnerabilities
-- ============================================

-- P0.1: Proteggere Telegram Bot Tokens
-- Drop la policy service role troppo permissiva
DROP POLICY IF EXISTS "Service role can read all telegram configs" ON public.user_telegram_config;

-- Crea policy service role limitata solo per notifiche (solo lettura token quando necessario)
CREATE POLICY "Service role can read telegram config for notifications"
ON public.user_telegram_config
FOR SELECT
TO service_role
USING (notifications_enabled = true);


-- P0.2: Spostare Estensioni PostgreSQL da public schema
-- Crea schema dedicato per estensioni
CREATE SCHEMA IF NOT EXISTS extensions;

-- Sposta estensioni esistenti (se presenti)
-- pg_stat_statements è comunemente usata
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    ALTER EXTENSION pg_stat_statements SET SCHEMA extensions;
  END IF;
END $$;


-- P1.1: Proteggere Notification Logs
-- Drop policy troppo permissiva
DROP POLICY IF EXISTS "Service role can manage notification logs" ON public.notification_logs;

-- Policy più restrittive per notification_logs
CREATE POLICY "Service role can insert notification logs"
ON public.notification_logs
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can read notification logs"
ON public.notification_logs
FOR SELECT
TO service_role
USING (true);

-- Gli utenti autenticati non possono accedere ai notification logs direttamente
-- Solo service role per operazioni di sistema


-- P1.2: Audit Logging per Accessi Admin
-- Crea tabella per audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS per admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user ON public.admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);


-- P1.3: Migliorare funzioni admin con audit logging
-- Aggiorna funzione admin_delete_user per includere audit
CREATE OR REPLACE FUNCTION public.admin_delete_user_with_audit(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Log the action
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    auth.uid(), 
    'DELETE_USER',
    target_user_id,
    jsonb_build_object('timestamp', now())
  );
  
  -- Proceed with deletion (la logica esistente va qui)
  -- Per ora lasciamo che sia gestita dall'edge function
END;
$$;


-- P1.4: Aggiorna funzione admin_update_user_role con audit
CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id uuid, new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role app_role;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Get old role for audit
  SELECT role INTO old_role FROM user_roles WHERE user_id = target_user_id;
  
  -- Prevent removing last admin
  IF new_role != 'admin' THEN
    IF (SELECT count(*) FROM user_roles WHERE role = 'admin') = 1 THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Cannot remove the last admin user';
      END IF;
    END IF;
  END IF;
  
  -- Update role
  UPDATE user_roles 
  SET role = new_role 
  WHERE user_id = target_user_id;
  
  -- Log the action
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    auth.uid(), 
    'UPDATE_USER_ROLE',
    target_user_id,
    jsonb_build_object(
      'old_role', old_role,
      'new_role', new_role,
      'timestamp', now()
    )
  );
END;
$$;


-- Commenti finali
COMMENT ON TABLE public.admin_audit_log IS 'Audit log for admin actions on user data';
COMMENT ON POLICY "Service role can read telegram config for notifications" ON public.user_telegram_config IS 'Service role can only read telegram configs when notifications are enabled';
COMMENT ON SCHEMA extensions IS 'Dedicated schema for PostgreSQL extensions to avoid public schema pollution';
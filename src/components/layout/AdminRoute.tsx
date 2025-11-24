import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [serverVerified, setServerVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
        setVerifying(false);
      } else if (!isAdmin) {
        navigate('/');
        setVerifying(false);
      } else {
        // Verify admin status server-side before rendering UI
        const verifyAdminAccess = async () => {
          try {
            const { error } = await supabase.rpc('admin_get_all_users');
            if (error) {
              navigate('/');
              setServerVerified(false);
            } else {
              setServerVerified(true);
            }
          } catch (err) {
            navigate('/');
            setServerVerified(false);
          } finally {
            setVerifying(false);
          }
        };
        verifyAdminAccess();
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user && isAdmin && serverVerified ? <>{children}</> : null;
};

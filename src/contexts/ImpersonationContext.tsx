import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface ImpersonationContextType {
  /** The user_id being impersonated, or null if not impersonating */
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  /** Start impersonating a user */
  startImpersonation: (userId: string, email: string) => void;
  /** Stop impersonating */
  stopImpersonation: () => void;
  /** Returns the effective user_id (impersonated or real) */
  effectiveUserId: string | undefined;
  /** Whether admin is currently impersonating */
  isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<string | null>(null);

  const startImpersonation = useCallback((userId: string, email: string) => {
    setImpersonatedUserId(userId);
    setImpersonatedUserEmail(email);
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonatedUserId(null);
    setImpersonatedUserEmail(null);
  }, []);

  const effectiveUserId = impersonatedUserId || user?.id;
  const isImpersonating = !!impersonatedUserId;

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedUserId,
        impersonatedUserEmail,
        startImpersonation,
        stopImpersonation,
        effectiveUserId,
        isImpersonating,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within ImpersonationProvider');
  }
  return context;
}

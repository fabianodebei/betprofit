import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Funzione per tradurre i messaggi di errore di Supabase in italiano
const translateAuthError = (errorMessage: string): string => {
  const translations: Record<string, string> = {
    'Password should be at least 6 characters': 'La password deve essere di almeno 6 caratteri',
    'Password is too weak': 'La password è troppo debole',
    'User already registered': 'Utente già registrato',
    'Invalid login credentials': 'Credenziali non valide',
    'Email not confirmed': 'Email non confermata',
    'Invalid email': 'Email non valida',
    'Password should be at least': 'La password deve essere di almeno',
    'characters': 'caratteri',
  };

  // Cerca una corrispondenza esatta
  if (translations[errorMessage]) {
    return translations[errorMessage];
  }

  // Cerca una corrispondenza parziale
  for (const [english, italian] of Object.entries(translations)) {
    if (errorMessage.includes(english)) {
      return errorMessage.replace(english, italian);
    }
  }

  return errorMessage;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Check for existing session first
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Redirect to reset password page on PASSWORD_RECOVERY event
          if (event === 'PASSWORD_RECOVERY') {
            setTimeout(() => {
              navigate('/reset-password');
            }, 0);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });

    if (!error) {
      // Invia email di benvenuto (non blocca la registrazione se fallisce)
      try {
        console.log('[Auth] Invoking send-welcome-email');
        const { data, error: fnError } = await supabase.functions.invoke('send-welcome-email', {
          body: { email, fullName }
        });
        if (fnError) {
          console.error('[Auth] send-welcome-email failed:', fnError);
        } else {
          console.log('[Auth] Welcome email edge response:', data);
        }
      } catch (emailError) {
        console.error('[Auth] Exception sending welcome email:', emailError);
        // Non mostriamo l'errore all'utente, la registrazione è comunque andata a buon fine
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(translateAuthError(error.message));
      return { error };
    }

    toast.success('Login effettuato!');
    navigate('/');
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      toast.error(translateAuthError(error.message));
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    toast.success('Logout effettuato');
    navigate('/auth');
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;

    try {
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email, redirectTo: redirectUrl },
      });

      if (error) {
        throw error;
      }

      toast.success('Email di recupero inviata! Controlla la tua casella di posta.');
      return { error: null };
    } catch (err: any) {
      toast.error(translateAuthError(err?.message || 'Errore durante l\'invio dell\'email'));
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signInWithGoogle, signOut, resetPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

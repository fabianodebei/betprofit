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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

    if (error) {
      toast.error(translateAuthError(error.message));
      return { error };
    }

    toast.success('Account creato con successo!');
    navigate('/');
    return { error: null };
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
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error(translateAuthError(error.message));
      return { error };
    }

    toast.success('Email di recupero inviata! Controlla la tua casella di posta.');
    return { error: null };
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

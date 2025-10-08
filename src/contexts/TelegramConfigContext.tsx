import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface TelegramConfig {
  id: string;
  user_id: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  notifications_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface TelegramConfigContextType {
  config: TelegramConfig | null;
  loading: boolean;
  updateConfig: (updates: Partial<Omit<TelegramConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
}

const TelegramConfigContext = createContext<TelegramConfigContextType | undefined>(undefined);

export const TelegramConfigProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConfig();
    } else {
      setConfig(null);
      setLoading(false);
    }
  }, [user]);

  const fetchConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_telegram_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setConfig({
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at),
        });
      } else {
        // Create default config if none exists
        const { data: newConfig, error: insertError } = await supabase
          .from('user_telegram_config')
          .insert({
            user_id: user.id,
            notifications_enabled: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setConfig({
          ...newConfig,
          created_at: new Date(newConfig.created_at),
          updated_at: new Date(newConfig.updated_at),
        });
      }
    } catch (error: any) {
      console.error('Error fetching telegram config:', error);
      toast.error('Errore nel caricamento della configurazione Telegram');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<Omit<TelegramConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user || !config) return;

    try {
      const { data, error } = await supabase
        .from('user_telegram_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setConfig({
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      });

      toast.success('Configurazione Telegram aggiornata');
    } catch (error: any) {
      console.error('Error updating telegram config:', error);
      toast.error('Errore nell\'aggiornamento della configurazione');
      throw error;
    }
  };

  return (
    <TelegramConfigContext.Provider value={{ config, loading, updateConfig }}>
      {children}
    </TelegramConfigContext.Provider>
  );
};

export const useTelegramConfig = () => {
  const context = useContext(TelegramConfigContext);
  if (!context) {
    throw new Error('useTelegramConfig must be used within TelegramConfigProvider');
  }
  return context;
};

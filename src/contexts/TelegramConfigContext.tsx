import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface TelegramConfig {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface TelegramConfigUpdate {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  notifications_enabled?: boolean;
}

interface TelegramConfigContextType {
  config: TelegramConfig | null;
  loading: boolean;
  updateConfig: (updates: TelegramConfigUpdate) => Promise<void>;
}

const TelegramConfigContext = createContext<TelegramConfigContextType | undefined>(undefined);

const normalizeTelegramToken = (value?: string) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';

  const withoutUrlPrefix = trimmed
    .replace(/^https?:\/\/api\.telegram\.org\/bot/i, '')
    .replace(/\/.*$/, '');

  return withoutUrlPrefix.replace(/^bot/i, '').trim();
};

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
      // Only fetch non-sensitive fields - sensitive data is only accessed server-side
      const { data, error } = await supabase
        .from('user_telegram_config')
        .select('id, user_id, notifications_enabled, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setConfig({
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at),
        });
      } else {
        // Config should be created by trigger, but create as fallback
        console.warn('Telegram config not found, creating default config');
        const { data: newConfig, error: insertError } = await supabase
          .from('user_telegram_config')
          .insert({
            user_id: user.id,
            notifications_enabled: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating telegram config:', insertError);
          return;
        }

        setConfig({
          ...newConfig,
          created_at: new Date(newConfig.created_at),
          updated_at: new Date(newConfig.updated_at),
        });
      }
    } catch (error: any) {
      console.error('Error fetching telegram config:', error);
      // Don't show error toast during registration, it confuses users
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: TelegramConfigUpdate) => {
    if (!user || !config) return;

    try {
      // Filter out empty strings to avoid overwriting with empty values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== '')
      );

      // Encrypt sensitive fields if present
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (filteredUpdates.telegram_bot_token) {
        const botToken = normalizeTelegramToken(filteredUpdates.telegram_bot_token);
        // Call encryption function for bot token
        const { data: encryptedToken, error: encryptError } = await supabase
          .rpc('encrypt_telegram_credential', { credential: botToken });
        
        if (encryptError) throw encryptError;
        updateData.telegram_bot_token_encrypted = encryptedToken;
        // Recovery fallback for edge-runtime decryption mismatches
        updateData.telegram_bot_token = botToken;
      }
      
      if (filteredUpdates.telegram_chat_id) {
        const chatId = filteredUpdates.telegram_chat_id.trim();
        // Call encryption function for chat ID
        const { data: encryptedChatId, error: encryptError } = await supabase
          .rpc('encrypt_telegram_credential', { credential: chatId });
        
        if (encryptError) throw encryptError;
        updateData.telegram_chat_id_encrypted = encryptedChatId;
        // Recovery fallback for edge-runtime decryption mismatches
        updateData.telegram_chat_id = chatId;
      }
      
      if (filteredUpdates.notifications_enabled !== undefined) {
        updateData.notifications_enabled = filteredUpdates.notifications_enabled;
      }

      const { error } = await supabase
        .from('user_telegram_config')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh config (only non-sensitive fields)
      await fetchConfig();
    } catch (error: any) {
      console.error('Error updating telegram config:', error);
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

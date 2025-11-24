import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

export interface AdminPreferences {
  dashboardLayout?: string[];
  defaultTab?: string;
  chartsExpanded?: Record<string, boolean>;
  filters?: Record<string, any>;
}

const DEFAULT_PREFERENCES: AdminPreferences = {
  dashboardLayout: [
    'kpi-users',
    'kpi-bets', 
    'kpi-transactions',
    'kpi-accounts',
    'chart-registrations',
    'chart-roles',
    'stats-general',
    'stats-bets',
    'stats-accounts',
  ],
  defaultTab: 'dashboard',
  chartsExpanded: {},
  filters: {},
};

export const useAdminPreferences = () => {
  const [preferences, setPreferences] = useState<AdminPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('admin_preferences')
          .select('preferences')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.preferences && typeof data.preferences === 'object') {
          setPreferences({ ...DEFAULT_PREFERENCES, ...(data.preferences as AdminPreferences) });
        }
      } catch (error) {
        console.error('Error loading admin preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences to database
  const savePreferencesImmediate = useCallback(async (newPreferences: AdminPreferences) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('admin_preferences')
        .upsert({
          user_id: user.id,
          preferences: newPreferences as any,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving admin preferences:', error);
    }
  }, []);

  // Debounced save function with proper cleanup
  const debouncedSave = useDebounce(savePreferencesImmediate, 500);

  // Update preferences locally and save with debouncing
  const updatePreferences = useCallback((updates: Partial<AdminPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      debouncedSave(newPreferences);
      return newPreferences;
    });
  }, [debouncedSave]);

  // Reset to default preferences
  const resetPreferences = useCallback(async () => {
    setPreferences(DEFAULT_PREFERENCES);
    await savePreferencesImmediate(DEFAULT_PREFERENCES);
  }, [savePreferencesImmediate]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    resetPreferences,
  };
};

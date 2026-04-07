import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Reminder } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useImpersonation } from './ImpersonationContext';

interface ReminderContextType {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  loading: boolean;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { effectiveUserId } = useImpersonation();

  useEffect(() => {
    if (user) {
      fetchReminders();
    } else {
      setReminders([]);
      setLoading(false);
    }
  }, [user, effectiveUserId]);

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('data_di_scadenza', { ascending: true });

      if (error) throw error;

      const mappedReminders: Reminder[] = (data || []).map((r) => ({
        id: r.id,
        metodo: r.metodo,
        conto: r.conto,
        descrizione: r.descrizione,
        dataScadenza: new Date(r.data_di_scadenza),
        notificaPeriodo: r.notifica_periodo,
        stato: r.stato as 'Nuovo' | 'Letto',
        createdAt: new Date(r.created_at),
      }));

      setReminders(mappedReminders);
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          metodo: reminder.metodo,
          conto: reminder.conto,
          descrizione: reminder.descrizione,
          data_di_scadenza: reminder.dataScadenza.toISOString(),
          notifica_periodo: reminder.notificaPeriodo,
          stato: reminder.stato,
          user_id: effectiveUserId,
        })
        .select()
        .single();

      if (error) throw error;

      const newReminder: Reminder = {
        id: data.id,
        metodo: data.metodo,
        conto: data.conto,
        descrizione: data.descrizione,
        dataScadenza: new Date(data.data_di_scadenza),
        notificaPeriodo: data.notifica_periodo,
        stato: data.stato as 'Nuovo' | 'Letto',
        createdAt: new Date(data.created_at),
      };

      setReminders((prev) => [newReminder, ...prev]);
    } catch (error: any) {
      console.error('Error adding reminder:', error);
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const dbUpdates: any = {};
      if (updates.metodo !== undefined) dbUpdates.metodo = updates.metodo;
      if (updates.conto !== undefined) dbUpdates.conto = updates.conto;
      if (updates.descrizione !== undefined) dbUpdates.descrizione = updates.descrizione;
      if (updates.dataScadenza !== undefined) dbUpdates.data_di_scadenza = updates.dataScadenza.toISOString();
      if (updates.notificaPeriodo !== undefined) dbUpdates.notifica_periodo = updates.notificaPeriodo;
      if (updates.stato !== undefined) dbUpdates.stato = updates.stato;

      const { error } = await supabase
        .from('reminders')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setReminders((prev) =>
        prev.map((reminder) => (reminder.id === id ? { ...reminder, ...updates } : reminder))
      );
    } catch (error: any) {
      console.error('Error updating reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
    }
  };

  return (
    <ReminderContext.Provider value={{ reminders, addReminder, updateReminder, deleteReminder, loading }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within ReminderProvider');
  }
  return context;
}

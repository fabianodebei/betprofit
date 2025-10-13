import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface AccountContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'saldoAttuale' | 'bilancioGiocate' | 'bilancioGiocateRapide'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getTotalBalance: () => number;
  loading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAccounts();
    } else {
      setAccounts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchAccounts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedAccounts: Account[] = (data || []).map((a) => ({
        id: a.id,
        intestatario: a.intestatario,
        conto: a.conto,
        descrizione: a.descrizione || undefined,
        saldoAttuale: Number(a.saldo_attuale),
        bilancioGiocate: Number(a.bilancio_giocate),
        bilancioGiocateRapide: Number(a.bilancio_giocate_rapide),
        stato: a.stato as 'Abilitato' | 'Disabilitato',
        walletId: a.wallet_id || undefined,
        createdAt: new Date(a.created_at),
      }));

      setAccounts(mappedAccounts);
    } catch (error: any) {
      toast.error('Errore nel caricamento dei conti');
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'saldoAttuale' | 'bilancioGiocate' | 'bilancioGiocateRapide'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          intestatario: account.intestatario,
          conto: account.conto,
          descrizione: account.descrizione || null,
          stato: account.stato,
          wallet_id: account.walletId || null,
          saldo_attuale: 0,
          bilancio_giocate: 0,
          bilancio_giocate_rapide: 0,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newAccount: Account = {
        id: data.id,
        intestatario: data.intestatario,
        conto: data.conto,
        descrizione: data.descrizione || undefined,
        saldoAttuale: Number(data.saldo_attuale),
        bilancioGiocate: Number(data.bilancio_giocate),
        bilancioGiocateRapide: Number(data.bilancio_giocate_rapide),
        stato: data.stato as 'Abilitato' | 'Disabilitato',
        walletId: data.wallet_id || undefined,
        createdAt: new Date(data.created_at),
      };

      setAccounts((prev) => [newAccount, ...prev]);
      toast.success('Conto aggiunto con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiunta del conto');
      console.error('Error adding account:', error);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const dbUpdates: any = {};
      if (updates.intestatario !== undefined) dbUpdates.intestatario = updates.intestatario;
      if (updates.conto !== undefined) dbUpdates.conto = updates.conto;
      if (updates.descrizione !== undefined) dbUpdates.descrizione = updates.descrizione;
      if (updates.saldoAttuale !== undefined) dbUpdates.saldo_attuale = updates.saldoAttuale;
      if (updates.bilancioGiocate !== undefined) dbUpdates.bilancio_giocate = updates.bilancioGiocate;
      if (updates.bilancioGiocateRapide !== undefined) dbUpdates.bilancio_giocate_rapide = updates.bilancioGiocateRapide;
      if (updates.stato !== undefined) dbUpdates.stato = updates.stato;
      if (updates.walletId !== undefined) dbUpdates.wallet_id = updates.walletId;

      const { error } = await supabase
        .from('accounts')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setAccounts((prev) =>
        prev.map((account) => (account.id === id ? { ...account, ...updates } : account))
      );
      toast.success('Conto aggiornato con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiornamento del conto');
      console.error('Error updating account:', error);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAccounts((prev) => prev.filter((account) => account.id !== id));
      toast.success('Conto eliminato con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'eliminazione del conto');
      console.error('Error deleting account:', error);
    }
  };

  const getTotalBalance = () => {
    return accounts
      .filter((a) => a.stato === 'Abilitato')
      .reduce((sum, account) => sum + account.saldoAttuale, 0);
  };

  return (
    <AccountContext.Provider
      value={{ accounts, addAccount, updateAccount, deleteAccount, getTotalBalance, loading }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountProvider');
  }
  return context;
}

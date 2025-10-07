import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Wallet } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WalletContextType {
  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => Promise<void>;
  updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  getTotalBalance: () => number;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedWallets: Wallet[] = (data || []).map((w) => ({
        id: w.id,
        intestatario: w.intestatario,
        nome: w.nome,
        descrizione: w.descrizione || undefined,
        saldoAttuale: Number(w.saldo_attuale),
        stato: w.stato as 'Abilitato' | 'Disabilitato',
        createdAt: new Date(w.created_at),
      }));

      setWallets(mappedWallets);
    } catch (error: any) {
      toast.error('Errore nel caricamento dei wallet');
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          intestatario: wallet.intestatario,
          nome: wallet.nome,
          descrizione: wallet.descrizione || null,
          saldo_attuale: wallet.saldoAttuale,
          stato: wallet.stato,
        })
        .select()
        .single();

      if (error) throw error;

      const newWallet: Wallet = {
        id: data.id,
        intestatario: data.intestatario,
        nome: data.nome,
        descrizione: data.descrizione || undefined,
        saldoAttuale: Number(data.saldo_attuale),
        stato: data.stato as 'Abilitato' | 'Disabilitato',
        createdAt: new Date(data.created_at),
      };

      setWallets((prev) => [newWallet, ...prev]);
      toast.success('Wallet aggiunto con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiunta del wallet');
      console.error('Error adding wallet:', error);
    }
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    try {
      const dbUpdates: any = {};
      if (updates.intestatario !== undefined) dbUpdates.intestatario = updates.intestatario;
      if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
      if (updates.descrizione !== undefined) dbUpdates.descrizione = updates.descrizione;
      if (updates.saldoAttuale !== undefined) dbUpdates.saldo_attuale = updates.saldoAttuale;
      if (updates.stato !== undefined) dbUpdates.stato = updates.stato;

      const { error } = await supabase
        .from('wallets')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setWallets((prev) =>
        prev.map((wallet) => (wallet.id === id ? { ...wallet, ...updates } : wallet))
      );
      toast.success('Wallet aggiornato con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiornamento del wallet');
      console.error('Error updating wallet:', error);
    }
  };

  const deleteWallet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWallets((prev) => prev.filter((wallet) => wallet.id !== id));
      toast.success('Wallet eliminato con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'eliminazione del wallet');
      console.error('Error deleting wallet:', error);
    }
  };

  const getTotalBalance = () => {
    return wallets
      .filter((w) => w.stato === 'Abilitato')
      .reduce((sum, wallet) => sum + wallet.saldoAttuale, 0);
  };

  return (
    <WalletContext.Provider
      value={{ wallets, addWallet, updateWallet, deleteWallet, getTotalBalance, loading }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallets() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallets must be used within WalletProvider');
  }
  return context;
}

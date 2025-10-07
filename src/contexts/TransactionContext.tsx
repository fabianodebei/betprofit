import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('registrato', { ascending: false });

      if (error) throw error;

      const mappedTransactions: Transaction[] = (data || []).map((t) => ({
        id: t.id,
        metodo: t.metodo as 'Deposito' | 'Spesa' | 'Prelievo',
        conto: t.conto,
        wallet: t.wallet || undefined,
        addebito: t.addebito ? Number(t.addebito) : undefined,
        accredito: t.accredito ? Number(t.accredito) : undefined,
        descrizione: t.descrizione || undefined,
        registrato: new Date(t.registrato),
      }));

      setTransactions(mappedTransactions);
    } catch (error: any) {
      toast.error('Errore nel caricamento delle transazioni');
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          metodo: transaction.metodo,
          conto: transaction.conto,
          wallet: transaction.wallet || null,
          addebito: transaction.addebito || null,
          accredito: transaction.accredito || null,
          descrizione: transaction.descrizione || null,
          registrato: transaction.registrato.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const newTransaction: Transaction = {
        id: data.id,
        metodo: data.metodo as 'Deposito' | 'Spesa' | 'Prelievo',
        conto: data.conto,
        wallet: data.wallet || undefined,
        addebito: data.addebito ? Number(data.addebito) : undefined,
        accredito: data.accredito ? Number(data.accredito) : undefined,
        descrizione: data.descrizione || undefined,
        registrato: new Date(data.registrato),
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      toast.success('Transazione aggiunta con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiunta della transazione');
      console.error('Error adding transaction:', error);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const dbUpdates: any = {};
      if (updates.metodo !== undefined) dbUpdates.metodo = updates.metodo;
      if (updates.conto !== undefined) dbUpdates.conto = updates.conto;
      if (updates.wallet !== undefined) dbUpdates.wallet = updates.wallet;
      if (updates.addebito !== undefined) dbUpdates.addebito = updates.addebito;
      if (updates.accredito !== undefined) dbUpdates.accredito = updates.accredito;
      if (updates.descrizione !== undefined) dbUpdates.descrizione = updates.descrizione;
      if (updates.registrato !== undefined) dbUpdates.registrato = updates.registrato.toISOString();

      const { error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setTransactions((prev) =>
        prev.map((transaction) => (transaction.id === id ? { ...transaction, ...updates } : transaction))
      );
      toast.success('Transazione aggiornata con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiornamento della transazione');
      console.error('Error updating transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
      toast.success('Transazione eliminata con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'eliminazione della transazione');
      console.error('Error deleting transaction:', error);
    }
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction, loading }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}

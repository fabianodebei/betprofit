import { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction } from '@/types';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  notifyChange: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [changeCounter, setChangeCounter] = useState(0);

  const notifyChange = () => {
    setChangeCounter(prev => prev + 1);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [...prev, newTransaction]);
    notifyChange();
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
    notifyChange();
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, notifyChange }}>
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

import { createContext, useContext, useState, ReactNode } from 'react';
import { Account } from '@/types';

interface AccountContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'saldoAttuale' | 'bilancioGiocate' | 'bilancioGiocateRapide'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getTotalBalance: () => number;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const addAccount = (account: Omit<Account, 'id' | 'createdAt' | 'saldoAttuale' | 'bilancioGiocate' | 'bilancioGiocateRapide'>) => {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
      saldoAttuale: 0,
      bilancioGiocate: 0,
      bilancioGiocateRapide: 0,
      createdAt: new Date(),
    };
    setAccounts((prev) => [...prev, newAccount]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((account) => (account.id === id ? { ...account, ...updates } : account))
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id));
  };

  const getTotalBalance = () => {
    return accounts
      .filter((a) => a.stato === 'Abilitato')
      .reduce((sum, account) => sum + account.saldoAttuale, 0);
  };

  return (
    <AccountContext.Provider
      value={{ accounts, addAccount, updateAccount, deleteAccount, getTotalBalance }}
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

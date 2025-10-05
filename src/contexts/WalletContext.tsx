import { createContext, useContext, useState, ReactNode } from 'react';
import { Wallet } from '@/types';

interface WalletContextType {
  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => void;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  getTotalBalance: () => number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const addWallet = (wallet: Omit<Wallet, 'id' | 'createdAt'>) => {
    const newWallet: Wallet = {
      ...wallet,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setWallets((prev) => [...prev, newWallet]);
  };

  const updateWallet = (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) =>
      prev.map((wallet) => (wallet.id === id ? { ...wallet, ...updates } : wallet))
    );
  };

  const deleteWallet = (id: string) => {
    setWallets((prev) => prev.filter((wallet) => wallet.id !== id));
  };

  const getTotalBalance = () => {
    return wallets
      .filter((w) => w.stato === 'Abilitato')
      .reduce((sum, wallet) => sum + wallet.saldoAttuale, 0);
  };

  return (
    <WalletContext.Provider
      value={{ wallets, addWallet, updateWallet, deleteWallet, getTotalBalance }}
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

import { createContext, useContext, useState, ReactNode } from 'react';
import { Bet } from '@/types';

interface BetContextType {
  bets: Bet[];
  addBet: (bet: Omit<Bet, 'id' | 'createdAt'>) => void;
  updateBet: (id: string, bet: Partial<Bet>) => void;
  deleteBet: (id: string) => void;
  archiveBet: (id: string, risultato: number) => void;
  reopenBet: (id: string) => void;
  getOngoingBets: () => Bet[];
  getArchivedBets: () => Bet[];
  getQuickBets: () => Bet[];
  getTotalStakeInCorso: () => number;
  notifyChange: () => void; // For dashboard reactivity
}

const BetContext = createContext<BetContextType | undefined>(undefined);

export function BetProvider({ children }: { children: ReactNode }) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [changeCounter, setChangeCounter] = useState(0);

  const notifyChange = () => {
    setChangeCounter(prev => prev + 1);
  };

  const addBet = (bet: Omit<Bet, 'id' | 'createdAt'>) => {
    const newBet: Bet = {
      ...bet,
      id: bet.tipo === 'Singola' || bet.tipo === 'Multipla' || bet.tipo === 'Casino' 
        ? `${bet.tipo} #6${Math.floor(100000 + Math.random() * 900000)}` 
        : crypto.randomUUID(),
      createdAt: new Date(),
    };
    setBets((prev) => [...prev, newBet]);
    notifyChange();
  };

  const updateBet = (id: string, updates: Partial<Bet>) => {
    setBets((prev) =>
      prev.map((bet) => (bet.id === id ? { ...bet, ...updates } : bet))
    );
    notifyChange();
  };

  const deleteBet = (id: string) => {
    setBets((prev) => prev.filter((bet) => bet.id !== id));
    notifyChange();
  };

  const archiveBet = (id: string, risultato: number) => {
    updateBet(id, { stato: 'Archiviata', risultato });
  };

  const reopenBet = (id: string) => {
    updateBet(id, { stato: 'In Corso', risultato: undefined });
  };

  const getOngoingBets = () => {
    return bets.filter((bet) => bet.stato === 'In Corso' && bet.tipo !== 'Rapida');
  };

  const getArchivedBets = () => {
    return bets.filter((bet) => bet.stato === 'Archiviata');
  };

  const getQuickBets = () => {
    return bets.filter((bet) => bet.tipo === 'Rapida');
  };

  const getTotalStakeInCorso = () => {
    return getOngoingBets().reduce((sum, bet) => sum + bet.stake, 0);
  };

  return (
    <BetContext.Provider
      value={{
        bets,
        addBet,
        updateBet,
        deleteBet,
        archiveBet,
        reopenBet,
        getOngoingBets,
        getArchivedBets,
        getQuickBets,
        getTotalStakeInCorso,
        notifyChange,
      }}
    >
      {children}
    </BetContext.Provider>
  );
}

export function useBets() {
  const context = useContext(BetContext);
  if (!context) {
    throw new Error('useBets must be used within BetProvider');
  }
  return context;
}

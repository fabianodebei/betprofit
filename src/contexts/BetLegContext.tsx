import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { BetLeg } from '@/types';
import { toast } from 'sonner';

interface BetLegContextType {
  betLegs: BetLeg[];
  addBetLeg: (betLeg: Omit<BetLeg, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateBetLeg: (id: string, betLeg: Partial<BetLeg>) => Promise<void>;
  deleteBetLeg: (id: string) => Promise<void>;
  getBetLegsByBetId: (betId: string) => BetLeg[];
  refetchBetLegs: () => Promise<void>;
  loading: boolean;
}

const BetLegContext = createContext<BetLegContextType | undefined>(undefined);

export const BetLegProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [betLegs, setBetLegs] = useState<BetLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBetLegs();
      subscribeToChanges();
    } else {
      setBetLegs([]);
      setLoading(false);
    }
  }, [user]);

  const fetchBetLegs = async () => {
    try {
      const { data, error } = await supabase
        .from('bet_legs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('fetchBetLegs raw data:', data);
      const mappedLegs = data.map((leg) => ({
        id: leg.id,
        betId: leg.bet_id,
        userId: leg.user_id,
        evento: leg.evento,
        competizione: leg.competizione,
        mercato: leg.mercato,
        selezione: leg.selezione,
        quota: Number(leg.quota),
        stato: leg.stato as 'In Corso' | 'Vinta' | 'Persa' | 'Void',
        risultato: leg.risultato,
        dataEvento: new Date(leg.data_evento),
        createdAt: new Date(leg.created_at),
      }));
      console.log('fetchBetLegs mapped:', mappedLegs);
      setBetLegs(mappedLegs);
    } catch (error: any) {
      console.error('Error fetching bet legs:', error);
      toast.error('Errore nel caricamento delle selezioni');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('bet_legs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bet_legs',
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        () => {
          fetchBetLegs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addBetLeg = async (betLeg: Omit<BetLeg, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error } = await supabase.from('bet_legs').insert([
        {
          bet_id: betLeg.betId,
          user_id: userData.user.id,
          evento: betLeg.evento,
          competizione: betLeg.competizione,
          mercato: betLeg.mercato,
          selezione: betLeg.selezione,
          quota: betLeg.quota,
          stato: betLeg.stato,
          risultato: betLeg.risultato,
          data_evento: betLeg.dataEvento.toISOString(),
        },
      ]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error adding bet leg:', error);
      toast.error("Errore nell'aggiunta della selezione");
      throw error;
    }
  };

  const updateBetLeg = async (id: string, betLeg: Partial<BetLeg>) => {
    try {
      const updateData: any = {};
      if (betLeg.evento !== undefined) updateData.evento = betLeg.evento;
      if (betLeg.competizione !== undefined) updateData.competizione = betLeg.competizione;
      if (betLeg.mercato !== undefined) updateData.mercato = betLeg.mercato;
      if (betLeg.selezione !== undefined) updateData.selezione = betLeg.selezione;
      if (betLeg.quota !== undefined) updateData.quota = betLeg.quota;
      if (betLeg.stato !== undefined) updateData.stato = betLeg.stato;
      if (betLeg.risultato !== undefined) updateData.risultato = betLeg.risultato;
      if (betLeg.dataEvento !== undefined) updateData.data_evento = betLeg.dataEvento.toISOString();

      const { error } = await supabase.from('bet_legs').update(updateData).eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating bet leg:', error);
      toast.error("Errore nell'aggiornamento della selezione");
      throw error;
    }
  };

  const deleteBetLeg = async (id: string) => {
    try {
      const { error } = await supabase.from('bet_legs').delete().eq('id', id);

      if (error) throw error;
      toast.success('Selezione eliminata');
    } catch (error: any) {
      console.error('Error deleting bet leg:', error);
      toast.error("Errore nell'eliminazione della selezione");
      throw error;
    }
  };

  const getBetLegsByBetId = (betId: string): BetLeg[] => {
    const filtered = betLegs.filter((leg) => leg.betId === betId);
    console.log('getBetLegsByBetId called with:', betId, 'found:', filtered.length, 'legs');
    console.log('All betLegs in context:', betLegs.map(l => ({ id: l.id, betId: l.betId, evento: l.evento })));
    return filtered;
  };

  return (
    <BetLegContext.Provider
      value={{
        betLegs,
        addBetLeg,
        updateBetLeg,
        deleteBetLeg,
        getBetLegsByBetId,
        refetchBetLegs: fetchBetLegs,
        loading,
      }}
    >
      {children}
    </BetLegContext.Provider>
  );
};

export const useBetLegs = () => {
  const context = useContext(BetLegContext);
  if (context === undefined) {
    throw new Error('useBetLegs must be used within a BetLegProvider');
  }
  return context;
};

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LayBet } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useImpersonation } from './ImpersonationContext';

interface LayBetContextType {
  layBets: LayBet[];
  addLayBet: (layBet: Omit<LayBet, 'id' | 'createdAt'>) => Promise<void>;
  updateLayBet: (id: string, layBet: Partial<LayBet>) => Promise<void>;
  deleteLayBet: (id: string) => Promise<void>;
  getLayBetsByParentId: (parentBetId: string) => LayBet[];
  loading: boolean;
}

const LayBetContext = createContext<LayBetContextType | undefined>(undefined);

export function LayBetProvider({ children }: { children: ReactNode }) {
  const [layBets, setLayBets] = useState<LayBet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { effectiveUserId } = useImpersonation();

  useEffect(() => {
    if (user) {
      fetchLayBets();

      // Listen to realtime changes
      const channel = supabase
        .channel('lay-bets-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lay_bets',
            filter: `user_id=eq.${effectiveUserId}`
          },
          () => {
            fetchLayBets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLayBets([]);
      setLoading(false);
    }
  }, [user, effectiveUserId]);

  const fetchLayBets = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lay_bets')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedLayBets: LayBet[] = (data || []).map((lb: any) => ({
        id: lb.id,
        parentBetId: lb.parent_bet_id,
        metodo: lb.metodo as 'Punta' | 'Banca',
        evento: lb.evento,
        dataEvento: new Date(lb.data_evento),
        mercato: lb.mercato,
        conto: lb.conto,
        stake: Number(lb.stake),
        quotaBanca: Number(lb.quota_banca),
        quotaPunta: Number(lb.quota_punta),
        tassePercentuale: Number(lb.tasse_percentuale),
        attiva: lb.attiva ?? true,
        stato: lb.stato || 'Bozza',
        urlEvento: lb.url_evento || undefined,
        createdAt: new Date(lb.created_at),
      }));

      setLayBets(mappedLayBets);
    } catch (error: any) {
      console.error('Error fetching lay bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLayBet = async (layBet: Omit<LayBet, 'id' | 'createdAt'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lay_bets')
        .insert({
          parent_bet_id: layBet.parentBetId,
          metodo: layBet.metodo,
          evento: layBet.evento,
          data_evento: layBet.dataEvento.toISOString(),
          mercato: layBet.mercato,
          conto: layBet.conto,
          stake: layBet.stake,
          quota_banca: layBet.quotaBanca,
          quota_punta: layBet.quotaPunta,
          tasse_percentuale: layBet.tassePercentuale,
          attiva: layBet.attiva ?? true,
          stato: layBet.stato || 'Bozza',
          url_evento: layBet.urlEvento || null,
          user_id: effectiveUserId,
        })
        .select()
        .single();

      if (error) throw error;

      const dataAny = data as any;
      const newLayBet: LayBet = {
        id: dataAny.id,
        parentBetId: dataAny.parent_bet_id,
        metodo: dataAny.metodo as 'Punta' | 'Banca',
        evento: dataAny.evento,
        dataEvento: new Date(dataAny.data_evento),
        mercato: dataAny.mercato,
        conto: dataAny.conto,
        stake: Number(dataAny.stake),
        quotaBanca: Number(dataAny.quota_banca),
        quotaPunta: Number(dataAny.quota_punta),
        tassePercentuale: Number(dataAny.tasse_percentuale),
        attiva: dataAny.attiva ?? true,
        stato: (dataAny.stato || 'Bozza') as LayBet['stato'],
        urlEvento: dataAny.url_evento || undefined,
        createdAt: new Date(dataAny.created_at),
      };

      setLayBets((prev) => [newLayBet, ...prev]);
    } catch (error: any) {
      console.error('Error adding lay bet:', error);
    }
  };

  const updateLayBet = async (id: string, updates: Partial<LayBet>) => {
    try {
      const dbUpdates: any = {};
      if (updates.metodo !== undefined) dbUpdates.metodo = updates.metodo;
      if (updates.evento !== undefined) dbUpdates.evento = updates.evento;
      if (updates.dataEvento !== undefined) dbUpdates.data_evento = updates.dataEvento.toISOString();
      if (updates.mercato !== undefined) dbUpdates.mercato = updates.mercato;
      if (updates.conto !== undefined) dbUpdates.conto = updates.conto;
      if (updates.stake !== undefined) dbUpdates.stake = updates.stake;
      if (updates.quotaBanca !== undefined) dbUpdates.quota_banca = updates.quotaBanca;
      if (updates.quotaPunta !== undefined) dbUpdates.quota_punta = updates.quotaPunta;
      if (updates.tassePercentuale !== undefined) dbUpdates.tasse_percentuale = updates.tassePercentuale;
      if (updates.attiva !== undefined) dbUpdates.attiva = updates.attiva;
      if (updates.stato !== undefined) dbUpdates.stato = updates.stato;
      if (updates.urlEvento !== undefined) dbUpdates.url_evento = updates.urlEvento;

      const { error } = await supabase
        .from('lay_bets')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setLayBets((prev) =>
        prev.map((layBet) => (layBet.id === id ? { ...layBet, ...updates } : layBet))
      );
    } catch (error: any) {
      console.error('Error updating lay bet:', error);
    }
  };

  const deleteLayBet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lay_bets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLayBets((prev) => prev.filter((layBet) => layBet.id !== id));
    } catch (error: any) {
      console.error('Error deleting lay bet:', error);
    }
  };

  const getLayBetsByParentId = (parentBetId: string) => {
    const filtered = layBets.filter((layBet) => layBet.parentBetId === parentBetId);
    return filtered.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
  };

  return (
    <LayBetContext.Provider
      value={{
        layBets,
        addLayBet,
        updateLayBet,
        deleteLayBet,
        getLayBetsByParentId,
        loading,
      }}
    >
      {children}
    </LayBetContext.Provider>
  );
}

export function useLayBets() {
  const context = useContext(LayBetContext);
  if (!context) {
    throw new Error('useLayBets must be used within LayBetProvider');
  }
  return context;
}

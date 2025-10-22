import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LayBet } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

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
            filter: `user_id=eq.${user.id}`
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
  }, [user]);

  const fetchLayBets = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lay_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedLayBets: LayBet[] = (data || []).map((lb) => ({
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
        urlEvento: lb.url_evento || undefined,
        createdAt: new Date(lb.created_at),
      }));

      setLayBets(mappedLayBets);
    } catch (error: any) {
      toast.error('Errore nel caricamento delle bancate');
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
          url_evento: layBet.urlEvento || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newLayBet: LayBet = {
        id: data.id,
        parentBetId: data.parent_bet_id,
        metodo: data.metodo as 'Punta' | 'Banca',
        evento: data.evento,
        dataEvento: new Date(data.data_evento),
        mercato: data.mercato,
        conto: data.conto,
        stake: Number(data.stake),
        quotaBanca: Number(data.quota_banca),
        quotaPunta: Number(data.quota_punta),
        tassePercentuale: Number(data.tasse_percentuale),
        urlEvento: data.url_evento || undefined,
        createdAt: new Date(data.created_at),
      };

      setLayBets((prev) => [newLayBet, ...prev]);
      toast.success('Bancata aggiunta con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiunta della bancata');
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
      if (updates.urlEvento !== undefined) dbUpdates.url_evento = updates.urlEvento;

      const { error } = await supabase
        .from('lay_bets')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setLayBets((prev) =>
        prev.map((layBet) => (layBet.id === id ? { ...layBet, ...updates } : layBet))
      );
      toast.success('Bancata aggiornata con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiornamento della bancata');
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
      toast.success('Bancata eliminata con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'eliminazione della bancata');
      console.error('Error deleting lay bet:', error);
    }
  };

  const getLayBetsByParentId = (parentBetId: string) => {
    return layBets
      .filter((layBet) => layBet.parentBetId === parentBetId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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

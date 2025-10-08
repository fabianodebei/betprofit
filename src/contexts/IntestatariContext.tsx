import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Intestatario = {
  id: string;
  nome: string;
  descrizione?: string;
  stato: 'Abilitato' | 'Disabilitato';
  predefinito: boolean;
  createdAt: Date;
};

type IntestatariContextType = {
  intestatari: Intestatario[];
  loading: boolean;
  addIntestatario: (intestatario: Omit<Intestatario, 'id' | 'createdAt'>) => Promise<void>;
  updateIntestatario: (id: string, intestatario: Partial<Omit<Intestatario, 'id' | 'createdAt'>>) => Promise<void>;
  deleteIntestatario: (id: string) => Promise<void>;
};

const IntestatariContext = createContext<IntestatariContextType | undefined>(undefined);

export function IntestatariProvider({ children }: { children: ReactNode }) {
  const [intestatari, setIntestatari] = useState<Intestatario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntestatari();

    const channel = supabase
      .channel('intestatari-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intestatari'
        },
        () => {
          fetchIntestatari();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIntestatari = async () => {
    try {
      const { data, error } = await supabase
        .from('intestatari')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      setIntestatari(data.map(item => ({
        id: item.id,
        nome: item.nome,
        descrizione: item.descrizione || undefined,
        stato: item.stato as 'Abilitato' | 'Disabilitato',
        predefinito: item.predefinito,
        createdAt: new Date(item.created_at),
      })));
    } catch (error) {
      console.error('Error fetching intestatari:', error);
      toast.error('Errore nel caricamento degli intestatari');
    } finally {
      setLoading(false);
    }
  };

  const addIntestatario = async (intestatario: Omit<Intestatario, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('intestatari')
        .insert({
          nome: intestatario.nome,
          descrizione: intestatario.descrizione || null,
          stato: intestatario.stato,
          predefinito: intestatario.predefinito,
        });

      if (error) throw error;
      toast.success('Intestatario aggiunto con successo');
    } catch (error: any) {
      console.error('Error adding intestatario:', error);
      if (error.code === '23505') {
        toast.error('Un intestatario con questo nome esiste già');
      } else {
        toast.error('Errore nell\'aggiunta dell\'intestatario');
      }
      throw error;
    }
  };

  const updateIntestatario = async (id: string, intestatario: Partial<Omit<Intestatario, 'id' | 'createdAt'>>) => {
    try {
      const updateData: any = {};
      if (intestatario.nome !== undefined) updateData.nome = intestatario.nome;
      if (intestatario.descrizione !== undefined) updateData.descrizione = intestatario.descrizione || null;
      if (intestatario.stato !== undefined) updateData.stato = intestatario.stato;
      if (intestatario.predefinito !== undefined) updateData.predefinito = intestatario.predefinito;

      const { error } = await supabase
        .from('intestatari')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Intestatario aggiornato con successo');
    } catch (error: any) {
      console.error('Error updating intestatario:', error);
      if (error.code === '23505') {
        toast.error('Un intestatario con questo nome esiste già');
      } else {
        toast.error('Errore nell\'aggiornamento dell\'intestatario');
      }
      throw error;
    }
  };

  const deleteIntestatario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('intestatari')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Intestatario eliminato con successo');
    } catch (error) {
      console.error('Error deleting intestatario:', error);
      toast.error('Errore nell\'eliminazione dell\'intestatario');
      throw error;
    }
  };

  return (
    <IntestatariContext.Provider
      value={{
        intestatari,
        loading,
        addIntestatario,
        updateIntestatario,
        deleteIntestatario,
      }}
    >
      {children}
    </IntestatariContext.Provider>
  );
}

export function useIntestatari() {
  const context = useContext(IntestatariContext);
  if (context === undefined) {
    throw new Error('useIntestatari must be used within an IntestatariProvider');
  }
  return context;
}

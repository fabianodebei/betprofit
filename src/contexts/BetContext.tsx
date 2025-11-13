import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bet } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { calculateDeleteBetUpdate } from '@/utils/betCalculations';

interface BetContextType {
  bets: Bet[];
  addBet: (bet: Omit<Bet, 'id' | 'createdAt'>) => Promise<string>;
  updateBet: (id: string, bet: Partial<Bet>) => Promise<void>;
  deleteBet: (id: string) => Promise<void>;
  archiveBet: (id: string, risultato: number, outcome: 'win' | 'loss' | 'refund', esitoDettaglio?: string) => Promise<void>;
  reopenBet: (id: string) => Promise<void>;
  getOngoingBets: () => Bet[];
  getArchivedBets: () => Bet[];
  getQuickBets: () => Bet[];
  getTotalStakeInCorso: () => number;
  loading: boolean;
}

const BetContext = createContext<BetContextType | undefined>(undefined);

export function BetProvider({ children }: { children: ReactNode }) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBets();

      // Listen to realtime changes
      const channel = supabase
        .channel('bets-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bets',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchBets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setBets([]);
      setLoading(false);
    }
  }, [user]);

  const fetchBets = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedBets: Bet[] = (data || []).map((b: any) => ({
        id: b.id,
        tipo: b.tipo as 'Singola' | 'Multipla' | 'Casino' | 'Rapida',
        conto: b.conto,
        stake: Number(b.stake),
        quota: b.quota ? Number(b.quota) : undefined,
        evento: b.evento || undefined,
        dataEvento: new Date(b.data_evento),
        metodo: b.metodo || undefined,
        tipoBonus: b.tipo_bonus as 'Nessuno' | 'Bonus' | 'Rimborso' | 'Free Bet' | undefined,
        bonus: b.bonus ? Number(b.bonus) : undefined,
        rimborso: b.rimborso ? Number(b.rimborso) : undefined,
        stato: b.stato as 'In Corso' | 'Archiviata',
        statoEvento: b.stato_evento as 'Bozza' | 'In Corso' | 'Vinto' | 'Perso' | 'Annullato' | undefined,
        risultato: b.risultato ? Number(b.risultato) : undefined,
        esito: b.esito as 'win' | 'loss' | 'refund' | undefined,
        esitoDettaglio: b.esito_dettaglio || undefined,
        tag: b.tag || undefined,
        walletId: b.wallet_id || undefined,
        note: b.note || undefined,
        mercato: b.mercato || undefined,
        competizione: b.competizione || undefined,
        urlEvento: b.url_evento || undefined,
        nomeGioco: b.nome_gioco || undefined,
        quotaPunta: b.quota_punta ? Number(b.quota_punta) : undefined,
        percentualeBonus: b.percentuale_bonus ? Number(b.percentuale_bonus) : undefined,
        numeroMinimoSelezioni: b.numero_minimo_selezioni ? Number(b.numero_minimo_selezioni) : undefined,
        quotaCombinata: b.quota_combinata ? Number(b.quota_combinata) : undefined,
        vincitaPotenziale: b.vincita_potenziale ? Number(b.vincita_potenziale) : undefined,
        createdAt: new Date(b.created_at),
      }));

      setBets(mappedBets);
    } catch (error: any) {
      toast.error('Errore nel caricamento delle puntate');
      console.error('Error fetching bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBet = async (bet: Omit<Bet, 'id' | 'createdAt'>): Promise<string> => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('bets')
        .insert({
          tipo: bet.tipo,
          conto: bet.conto,
          stake: bet.stake,
          quota: bet.quota || null,
          evento: bet.evento || null,
          data_evento: bet.dataEvento.toISOString(),
          metodo: bet.metodo || null,
          tipo_bonus: bet.tipoBonus || null,
          bonus: bet.bonus || null,
          rimborso: bet.rimborso || null,
          stato: bet.stato,
          risultato: bet.risultato || null,
          tag: bet.tag || null,
          wallet_id: bet.walletId || null,
          note: bet.note || null,
          mercato: bet.mercato || null,
          competizione: bet.competizione || null,
          url_evento: bet.urlEvento || null,
          nome_gioco: bet.nomeGioco || null,
          quota_punta: bet.quotaPunta || null,
          percentuale_bonus: bet.percentualeBonus || null,
          numero_minimo_selezioni: bet.numeroMinimoSelezioni || null,
          quota_combinata: bet.quotaCombinata || null,
          vincita_potenziale: bet.vincitaPotenziale || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newBet: Bet = {
        id: data.id,
        tipo: data.tipo as 'Singola' | 'Multipla' | 'Casino' | 'Rapida',
        conto: data.conto,
        stake: Number(data.stake),
        quota: data.quota ? Number(data.quota) : undefined,
        evento: data.evento || undefined,
        dataEvento: new Date(data.data_evento),
        metodo: data.metodo || undefined,
        tipoBonus: data.tipo_bonus as 'Nessuno' | 'Bonus' | 'Rimborso' | 'Free Bet' | undefined,
        bonus: data.bonus ? Number(data.bonus) : undefined,
        rimborso: data.rimborso ? Number(data.rimborso) : undefined,
        stato: data.stato as 'In Corso' | 'Archiviata',
        statoEvento: (data as any).stato_evento as 'Bozza' | 'In Corso' | 'Vinto' | 'Perso' | 'Annullato' | undefined,
        risultato: data.risultato ? Number(data.risultato) : undefined,
        esito: data.esito as 'win' | 'loss' | 'refund' | undefined,
        esitoDettaglio: data.esito_dettaglio || undefined,
        tag: data.tag || undefined,
        walletId: data.wallet_id || undefined,
        note: data.note || undefined,
        mercato: data.mercato || undefined,
        competizione: data.competizione || undefined,
        urlEvento: data.url_evento || undefined,
        nomeGioco: data.nome_gioco || undefined,
        quotaPunta: data.quota_punta ? Number(data.quota_punta) : undefined,
        percentualeBonus: data.percentuale_bonus ? Number(data.percentuale_bonus) : undefined,
        numeroMinimoSelezioni: data.numero_minimo_selezioni ? Number(data.numero_minimo_selezioni) : undefined,
        quotaCombinata: data.quota_combinata ? Number(data.quota_combinata) : undefined,
        vincitaPotenziale: data.vincita_potenziale ? Number(data.vincita_potenziale) : undefined,
        createdAt: new Date(data.created_at),
      };

      setBets((prev) => [newBet, ...prev]);
      toast.success('Puntata aggiunta con successo');
      return data.id;
    } catch (error: any) {
      toast.error('Errore durante l\'aggiunta della puntata');
      console.error('Error adding bet:', error);
      throw error;
    }
  };

  const updateBet = async (id: string, updates: Partial<Bet>) => {
    try {
      const dbUpdates: any = {};
      if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
      if (updates.conto !== undefined) dbUpdates.conto = updates.conto;
      if (updates.stake !== undefined) dbUpdates.stake = updates.stake;
      if (updates.quota !== undefined) dbUpdates.quota = updates.quota;
      if (updates.evento !== undefined) dbUpdates.evento = updates.evento;
      if (updates.dataEvento !== undefined) dbUpdates.data_evento = updates.dataEvento.toISOString();
      if (updates.metodo !== undefined) dbUpdates.metodo = updates.metodo;
      if (updates.tipoBonus !== undefined) dbUpdates.tipo_bonus = updates.tipoBonus;
      if (updates.bonus !== undefined) dbUpdates.bonus = updates.bonus;
      if (updates.rimborso !== undefined) dbUpdates.rimborso = updates.rimborso;
      if (updates.stato !== undefined) dbUpdates.stato = updates.stato;
      if (updates.statoEvento !== undefined) dbUpdates.stato_evento = updates.statoEvento;
      if (updates.risultato !== undefined) dbUpdates.risultato = updates.risultato;
      if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
      if (updates.walletId !== undefined) dbUpdates.wallet_id = updates.walletId;
      if (updates.note !== undefined) dbUpdates.note = updates.note;
      if (updates.mercato !== undefined) dbUpdates.mercato = updates.mercato;
      if (updates.competizione !== undefined) dbUpdates.competizione = updates.competizione;
      if (updates.urlEvento !== undefined) dbUpdates.url_evento = updates.urlEvento;
      if (updates.nomeGioco !== undefined) dbUpdates.nome_gioco = updates.nomeGioco;
      if (updates.quotaPunta !== undefined) dbUpdates.quota_punta = updates.quotaPunta;
      if (updates.percentualeBonus !== undefined) dbUpdates.percentuale_bonus = updates.percentualeBonus;
      if (updates.numeroMinimoSelezioni !== undefined) dbUpdates.numero_minimo_selezioni = updates.numeroMinimoSelezioni;
      if (updates.quotaCombinata !== undefined) dbUpdates.quota_combinata = updates.quotaCombinata;
      if (updates.vincitaPotenziale !== undefined) dbUpdates.vincita_potenziale = updates.vincitaPotenziale;
      if (updates.esito !== undefined) dbUpdates.esito = updates.esito;
      if (updates.esitoDettaglio !== undefined) dbUpdates.esito_dettaglio = updates.esitoDettaglio;

      const { error } = await supabase
        .from('bets')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setBets((prev) =>
        prev.map((bet) => (bet.id === id ? { ...bet, ...updates } : bet))
      );
      
      // Don't show toast for stato_evento changes
      if (updates.statoEvento === undefined) {
        toast.success('Puntata aggiornata con successo');
      }
    } catch (error: any) {
      toast.error('Errore durante l\'aggiornamento della puntata');
      console.error('Error updating bet:', error);
    }
  };

  const deleteBet = async (id: string) => {
    try {
      const betToDelete = bets.find(b => b.id === id);
      if (!betToDelete) {
        throw new Error('Puntata non trovata');
      }

      // Find the associated account
      let accountQuery = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('conto', betToDelete.conto);

      if (betToDelete.walletId) {
        accountQuery = accountQuery.eq('wallet_id', betToDelete.walletId);
      }

      const { data: account, error: accountError } = await accountQuery.limit(1).maybeSingle();
      if (accountError) throw accountError;

      // Calculate and apply balance updates using helper function
      if (account) {
        const updateData = calculateDeleteBetUpdate(betToDelete, account);

        if (Object.keys(updateData).length > 0) {
          const { error: updateAccountError } = await supabase
            .from('accounts')
            .update(updateData)
            .eq('id', account.id);

          if (updateAccountError) throw updateAccountError;
          window.dispatchEvent(new Event('refresh-accounts'));
        }
      }

      // Delete the bet
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBets((prev) => prev.filter((bet) => bet.id !== id));
      toast.success('Puntata eliminata e saldi ripristinati');
    } catch (error: any) {
      toast.error('Errore durante l\'eliminazione della puntata');
      console.error('Error deleting bet:', error);
    }
  };

  const archiveBet = async (id: string, risultatoTotale: number, outcome: 'win' | 'loss' | 'refund', esitoDettaglio?: string) => {
    const bet = bets.find(b => b.id === id);
    if (!bet) return;

    let risultatoToSave = 0;

    // Calcola SEMPRE solo il risultato della punta principale (no bancate)
    const quota = bet.quota || bet.quotaCombinata || 1;
    if (outcome === 'win') {
      if (bet.tipoBonus === 'Free Bet') {
        risultatoToSave = bet.stake * (quota - 1);
      } else if (bet.tipoBonus === 'Bonus' && bet.bonus) {
        risultatoToSave = (bet.stake + bet.bonus) * quota - bet.stake;
      } else {
        risultatoToSave = bet.stake * quota - bet.stake;
      }
    } else if (outcome === 'loss') {
      if (bet.tipoBonus === 'Free Bet') {
        risultatoToSave = 0;
      } else {
        risultatoToSave = -bet.stake;
      }
    } else {
      risultatoToSave = 0; // refund
    }

    try {
      // Aggiorna la puntata con esito, risultato (solo punta) e dettaglio esito
      const { error: updateError } = await supabase
        .from('bets')
        .update({ 
          stato: 'Archiviata', 
          risultato: risultatoToSave, 
          esito: outcome,
          esito_dettaglio: esitoDettaglio || null
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Aggiorna stato locale immediatamente
      setBets((prev) => prev.map((b) => (b.id === id ? { ...b, stato: 'Archiviata', risultato: risultatoToSave } : b)));

      // Aggiorna i conti tramite ricalcolo centralizzato
      window.dispatchEvent(new Event('refresh-accounts'));
    } catch (error) {
      console.error('Error archiving bet:', error);
      toast.error('Errore durante l\'archiviazione della puntata');
    }
  };

  const reopenBet = async (id: string) => {
    const bet = bets.find(b => b.id === id);
    if (!bet || bet.stato !== 'Archiviata') return;

    const isFreeOrBonus = bet.tipoBonus === 'Free Bet' || bet.tipoBonus === 'Bonus';
    const risultatoVal = Number(bet.risultato ?? 0);
    const stakeVal = Number(bet.stake) || 0;

    // Trova l'account per ripristinare i saldi
    let accountQuery = supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user?.id)
      .eq('conto', bet.conto);

    if (bet.walletId) {
      accountQuery = accountQuery.eq('wallet_id', bet.walletId);
    }

    const { data: account } = await accountQuery.limit(1).maybeSingle();

    if (account) {
      // Annulla completamente gli effetti della scommessa riportando il saldo allo stato iniziale
      // (prima che la scommessa fosse creata)
      
      let updateData: any = {};
      
      // Per entrambi i tipi (normale e Free Bet), basta togliere il risultato dal saldo
      // In questo modo il saldo torna a quello iniziale prima della scommessa
      updateData.saldo_attuale = Number(account.saldo_attuale) - risultatoVal;

      if (bet.tipo === 'Rapida') {
        // Annulla archivio (togli risultato) e annulla creazione iniziale (aggiungi stake)
        updateData.bilancio_giocate_rapide = Number(account.bilancio_giocate_rapide) - risultatoVal + stakeVal;
      } else {
        // Annulla archivio (togli risultato) e annulla creazione iniziale (aggiungi stake)
        updateData.bilancio_giocate = Number(account.bilancio_giocate) - risultatoVal + stakeVal;
      }

      await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', account.id);

      window.dispatchEvent(new Event('refresh-accounts'));
    }

    await updateBet(id, { stato: 'In Corso', risultato: undefined });
  };

  const getOngoingBets = () => {
    return bets.filter((bet) => bet.stato === 'In Corso' && bet.tipo !== 'Rapida');
  };

  const getArchivedBets = () => {
    return bets.filter((bet) => bet.stato === 'Archiviata' && bet.tipo !== 'Rapida');
  };

  const getQuickBets = () => {
    return bets.filter((bet) => bet.tipo === 'Rapida');
  };

  const getTotalStakeInCorso = () => {
    return getOngoingBets().reduce((sum, bet) => {
      // Escludi Free Bet e Bonus (soldi regalati) dal totale puntate in corso
      if (bet.tipoBonus === 'Free Bet' || bet.tipoBonus === 'Bonus') return sum;
      return sum + (bet.stake > 0 ? bet.stake : 0);
    }, 0);
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
        loading,
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

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bet } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface BetContextType {
  bets: Bet[];
  addBet: (bet: Omit<Bet, 'id' | 'createdAt'>) => Promise<string>;
  updateBet: (id: string, bet: Partial<Bet>) => Promise<void>;
  deleteBet: (id: string) => Promise<void>;
  archiveBet: (id: string, risultato: number) => Promise<void>;
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
        risultato: b.risultato ? Number(b.risultato) : undefined,
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
        risultato: data.risultato ? Number(data.risultato) : undefined,
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

      const { error } = await supabase
        .from('bets')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setBets((prev) =>
        prev.map((bet) => (bet.id === id ? { ...bet, ...updates } : bet))
      );
      toast.success('Puntata aggiornata con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiornamento della puntata');
      console.error('Error updating bet:', error);
    }
  };

  const deleteBet = async (id: string) => {
    try {
      // Trova la bet da eliminare
      const betToDelete = bets.find(b => b.id === id);
      if (!betToDelete) {
        throw new Error('Puntata non trovata');
      }

      // Trova l'account per ripristinare i saldi (tenendo conto di possibili duplicati)
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

      if (account) {
        // Ripristina il saldo dell'account in base al tipo di scommessa
        let updateData: any = {};
        
        if (betToDelete.tipo === 'Rapida') {
          // Per giocate rapide: ripristina sempre il saldo (sottraendo il movimento)
          const newBilancioGiocateRapide = Number(account.bilancio_giocate_rapide) - betToDelete.stake;
          const newSaldoAttuale = Number(account.saldo_attuale) - betToDelete.stake;
          updateData.bilancio_giocate_rapide = newBilancioGiocateRapide;
          updateData.saldo_attuale = newSaldoAttuale;
        } else {
          // Per altre scommesse
          const newSaldoAttuale = Number(account.saldo_attuale) + betToDelete.stake;
          const newBilancioGiocate = Number(account.bilancio_giocate) - betToDelete.stake;
          updateData.saldo_attuale = newSaldoAttuale;
          updateData.bilancio_giocate = newBilancioGiocate;
        }

        const { error: updateAccountError } = await supabase
          .from('accounts')
          .update(updateData)
          .eq('id', account.id);

        if (updateAccountError) throw updateAccountError;
      }

      // Se c'è un wallet associato e NON è una giocata rapida, ripristina anche quello
      if (betToDelete.walletId && betToDelete.tipo !== 'Rapida') {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('id', betToDelete.walletId)
          .maybeSingle();

        if (walletError) throw walletError;

        if (wallet) {
          const newWalletSaldo = Number(wallet.saldo_attuale) + betToDelete.stake;

          const { error: updateWalletError } = await supabase
            .from('wallets')
            .update({ saldo_attuale: newWalletSaldo })
            .eq('id', betToDelete.walletId);

          if (updateWalletError) throw updateWalletError;
        }
      }

      // Elimina la bet
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

  const archiveBet = async (id: string, risultato: number) => {
    const bet = bets.find(b => b.id === id);
    
    // Update bet status and result
    await updateBet(id, { stato: 'Archiviata', risultato });
    
    // If it's a quick bet, update account saldo_attuale
    if (bet && bet.tipo === 'Rapida') {
      let accountQuery = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('conto', bet.conto);

      if (bet.walletId) {
        accountQuery = accountQuery.eq('wallet_id', bet.walletId);
      }

      const { data: account, error: accountError } = await accountQuery.limit(1).maybeSingle();
      
      if (accountError) {
        console.error('Error fetching account:', accountError);
        return;
      }
      
      if (!account) {
        // Nessun account trovato, non aggiorno il saldo
        return;
      }
      
      // Update saldo_attuale with the result
      const newSaldoAttuale = Number(account.saldo_attuale) + risultato;
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ saldo_attuale: newSaldoAttuale })
        .eq('id', account.id);
      
      if (updateError) {
        console.error('Error updating account:', updateError);
      }
    }
  };

  const reopenBet = async (id: string) => {
    await updateBet(id, { stato: 'In Corso', risultato: undefined });
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

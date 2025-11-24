import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface AccountContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'saldoAttuale' | 'bilancioGiocate' | 'bilancioGiocateRapide'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getTotalBalance: () => number;
  loading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAccounts();

      // Listen for custom refresh events from BetContext
      const handleRefetch = () => {
        fetchAccounts();
      };
      window.addEventListener('refresh-accounts', handleRefetch);

      // Listen to realtime changes
      const channel = supabase
        .channel('accounts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'accounts',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchAccounts();
          }
        )
        .subscribe();

      const betsChannel = supabase
        .channel('bets-balance')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bets',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchAccounts();
          }
        )
        .subscribe();

      const transactionsChannel = supabase
        .channel('transactions-balance')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchAccounts();
          }
        )
        .subscribe();

      const layChannel = supabase
        .channel('lay-bets-balance')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lay_bets',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchAccounts();
          }
        )
        .subscribe();

      return () => {
        window.removeEventListener('refresh-accounts', handleRefetch);
        supabase.removeChannel(channel);
        supabase.removeChannel(betsChannel);
        supabase.removeChannel(transactionsChannel);
        supabase.removeChannel(layChannel);
      };
    } else {
      setAccounts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchAccounts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedAccounts: Account[] = (data || []).map((a) => ({
        id: a.id,
        intestatario: a.intestatario,
        conto: a.conto,
        descrizione: a.descrizione || undefined,
        saldoAttuale: Number(a.saldo_attuale),
        bilancioGiocate: Number(a.bilancio_giocate),
        bilancioGiocateRapide: Number(a.bilancio_giocate_rapide),
        stato: a.stato as 'Abilitato' | 'Disabilitato',
        walletId: a.wallet_id || undefined,
        createdAt: new Date(a.created_at),
      }));

      // Recalcolo bilanci dalle puntate per correggere eventuali inconsistenze
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('id, tipo, conto, stato, stake, risultato, tipo_bonus, bonus, esito, esito_dettaglio')
        .eq('user_id', user.id);

      if (betsError) {
        console.error('Error fetching bets for account calculation:', betsError);
        throw betsError;
      }

      const { data: layData, error: layError } = await supabase
        .from('lay_bets')
        .select('id, parent_bet_id, metodo, conto, stake, quota_banca, tasse_percentuale, attiva, stato')
        .eq('user_id', user.id);

      if (layError) {
        console.error('Error fetching lay bets for account calculation:', layError);
        throw layError;
      }

      // Function to calculate lay bet results (same as ArchivedBets.tsx)
      const calculateLayBetResults = (betId: string, outcome: string, esitoDettaglio?: string) => {
        const associatedLayBets = (layData || []).filter(
          (lb: any) => lb.parent_bet_id === betId && lb.metodo === 'Banca' && ['In Corso', 'Vinto', 'Perso'].includes(lb.stato)
        );
        let total = 0;
        
        associatedLayBets.forEach((lb: any) => {
          if (outcome === 'win') {
            // Parent vinta: le lay bets sono perse
            total -= lb.stake * (lb.quota_banca - 1);
          } else if (outcome === 'loss') {
            // Parent persa: controlla lo stato effettivo di ogni lay bet
            if (lb.stato === 'Vinto') {
              // Lay bet vinta: profitto al netto delle tasse
              const profittoLordo = lb.stake;
              const tasse = profittoLordo * (lb.tasse_percentuale / 100);
              total += profittoLordo - tasse;
            } else if (lb.stato === 'Perso') {
              // Lay bet persa: perdita della responsabilità
              total -= lb.stake * (lb.quota_banca - 1);
            }
            // Se stato è 'In Corso' o altro, non fare nulla
          }
        });
        
        return total;
      };

      const giocateMap: Record<string, number> = {};
      const rapideMap: Record<string, number> = {};

      // Process all bets
      (betsData || []).forEach((b: any) => {
        const conto = b.conto as string;
        const tipo = b.tipo as string;
        const tipoBonus = b.tipo_bonus as string | null;
        const stake = Number(b.stake) || 0;
        const risultato = Number(b.risultato) || 0;
        const stato = b.stato as string;
        const esito = b.esito as string;
        const esitoDettaglio = b.esito_dettaglio as string | undefined;

        const isFreeOrBonus = tipoBonus === 'Free Bet' || tipoBonus === 'Bonus';

        if (tipo === 'Rapida' || tipo === 'Giocata Rapida' || tipo === 'Cashout') {
          // Quick bets
          if (stato === 'Archiviata') {
            rapideMap[conto] = (rapideMap[conto] || 0) + risultato;
          }
          return;
        }

        if (stato === 'In Corso') {
          // Ongoing bets: deduct stake
          if (!isFreeOrBonus) {
            giocateMap[conto] = (giocateMap[conto] || 0) - stake;
          }
        } else if (stato === 'Archiviata') {
          // Archived bets: add result + lay bet results
          const layResult = calculateLayBetResults(b.id, esito || 'refund', esitoDettaglio);
          const totalResult = risultato + layResult;
          
          if (!isFreeOrBonus) {
            giocateMap[conto] = (giocateMap[conto] || 0) + totalResult;
          }
        }
      });

      // Handle ongoing lay bets exposure (only for bets still in progress)
      const activeBetIds = new Set((betsData || [])
        .filter((b: any) => b.stato === 'In Corso')
        .map((b: any) => b.id));

      const activeLayData = (layData || []).filter((lb: any) => 
        lb.stato === 'In Corso' && activeBetIds.has(lb.parent_bet_id)
      );

      activeLayData.forEach((lb: any) => {
        const conto = lb.conto as string;
        
        if (lb.metodo === 'Banca') {
          // Bancata in corso: sottrai liability dal bilancio
          const liability = Number(lb.stake) * (Number(lb.quota_banca) - 1);
          giocateMap[conto] = (giocateMap[conto] || 0) - liability;
        } else if (lb.metodo === 'Punta') {
          // Puntata in corso: sottrai stake dal bilancio
          giocateMap[conto] = (giocateMap[conto] || 0) - Number(lb.stake);
        }
      });

      // Ricalcola saldo_attuale dalle transazioni (depositi/prelievi)
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('conto, metodo, accredito, addebito')
        .eq('user_id', user.id);

      const saldoDisponibileMap: Record<string, number> = {};
      (transactionsData || []).forEach((t: any) => {
        const conto = t.conto as string;
        if (!saldoDisponibileMap[conto]) saldoDisponibileMap[conto] = 0;
        
        if (t.metodo === 'Deposito') {
          saldoDisponibileMap[conto] += Number(t.accredito || 0);
        } else if (t.metodo === 'Prelievo' || t.metodo === 'Spesa') {
          saldoDisponibileMap[conto] -= Number(t.addebito || 0);
        } else if (t.metodo === 'Riconciliazione') {
          saldoDisponibileMap[conto] += Number(t.accredito || 0) - Number(t.addebito || 0);
        }
      });

      // Aggiorna DB se diverso e prepara stato corretto
      const correctedAccounts: Account[] = [];
      for (const acc of mappedAccounts) {
        const newBG = Number((giocateMap[acc.conto] ?? 0).toFixed(4));
        const newBR = Number((rapideMap[acc.conto] ?? 0).toFixed(4));
        const saldoBase = saldoDisponibileMap[acc.conto] ?? 0;
        // Il saldo attuale è: saldo base (depositi - prelievi) + bilancio giocate + bilancio rapide
        const newSaldo = Number((saldoBase + newBG + newBR).toFixed(4));
        
        // Confronta con tolleranza per evitare loop infiniti dovuti ad arrotondamenti
        const bgDiff = Math.abs(newBG - acc.bilancioGiocate);
        const brDiff = Math.abs(newBR - acc.bilancioGiocateRapide);
        const saldoDiff = Math.abs(newSaldo - acc.saldoAttuale);
        
        const needsUpdate = bgDiff > 0.01 || brDiff > 0.01 || saldoDiff > 0.01;
          
        if (needsUpdate) {
          await supabase
            .from('accounts')
            .update({ 
              bilancio_giocate: newBG, 
              bilancio_giocate_rapide: newBR,
              saldo_attuale: newSaldo
            })
            .eq('id', acc.id);
        }
        correctedAccounts.push({ 
          ...acc, 
          bilancioGiocate: newBG, 
          bilancioGiocateRapide: newBR,
          saldoAttuale: newSaldo
        });
      }

      setAccounts(correctedAccounts);
    } catch (error: any) {
      toast.error('Errore nel caricamento dei conti');
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = () => fetchAccounts();
    window.addEventListener('refresh-accounts', handler);
    return () => window.removeEventListener('refresh-accounts', handler);
  }, [user]);
  const addAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'saldoAttuale' | 'bilancioGiocate' | 'bilancioGiocateRapide'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          intestatario: account.intestatario,
          conto: account.conto,
          descrizione: account.descrizione || null,
          stato: account.stato,
          wallet_id: account.walletId || null,
          saldo_attuale: 0,
          bilancio_giocate: 0,
          bilancio_giocate_rapide: 0,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newAccount: Account = {
        id: data.id,
        intestatario: data.intestatario,
        conto: data.conto,
        descrizione: data.descrizione || undefined,
        saldoAttuale: Number(data.saldo_attuale),
        bilancioGiocate: Number(data.bilancio_giocate),
        bilancioGiocateRapide: Number(data.bilancio_giocate_rapide),
        stato: data.stato as 'Abilitato' | 'Disabilitato',
        walletId: data.wallet_id || undefined,
        createdAt: new Date(data.created_at),
      };

      setAccounts((prev) => [newAccount, ...prev]);
      toast.success('Conto aggiunto con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiunta del conto');
      console.error('Error adding account:', error);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const dbUpdates: any = {};
      if (updates.intestatario !== undefined) dbUpdates.intestatario = updates.intestatario;
      if (updates.conto !== undefined) dbUpdates.conto = updates.conto;
      if (updates.descrizione !== undefined) dbUpdates.descrizione = updates.descrizione;
      if (updates.saldoAttuale !== undefined) dbUpdates.saldo_attuale = updates.saldoAttuale;
      if (updates.bilancioGiocate !== undefined) dbUpdates.bilancio_giocate = updates.bilancioGiocate;
      if (updates.bilancioGiocateRapide !== undefined) dbUpdates.bilancio_giocate_rapide = updates.bilancioGiocateRapide;
      if (updates.stato !== undefined) dbUpdates.stato = updates.stato;
      if (updates.walletId !== undefined) dbUpdates.wallet_id = updates.walletId;

      const { error } = await supabase
        .from('accounts')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setAccounts((prev) =>
        prev.map((account) => (account.id === id ? { ...account, ...updates } : account))
      );
      toast.success('Conto aggiornato con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'aggiornamento del conto');
      console.error('Error updating account:', error);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAccounts((prev) => prev.filter((account) => account.id !== id));
      toast.success('Conto eliminato con successo');
    } catch (error: any) {
      toast.error('Errore durante l\'eliminazione del conto');
      console.error('Error deleting account:', error);
    }
  };

  const getTotalBalance = () => {
    return accounts
      .filter((a) => a.stato === 'Abilitato')
      .reduce((sum, account) => sum + account.saldoAttuale, 0);
  };

  return (
    <AccountContext.Provider
      value={{ accounts, addAccount, updateAccount, deleteAccount, getTotalBalance, loading }}
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

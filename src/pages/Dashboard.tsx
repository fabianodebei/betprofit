import { useEffect, useMemo, useState } from 'react';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, format, eachDayOfInterval, eachHourOfInterval, addHours } from 'date-fns';
import { it } from 'date-fns/locale';
import { TrendingUp, Calendar, Trophy, Wallet, BarChart3 } from 'lucide-react';
import { AdvancedKPICard } from '@/components/dashboard/AdvancedKPICard';
import { ROIByBookmakerChart } from '@/components/dashboard/ROIByBookmakerChart';
import { TrendChart, TrendPeriod } from '@/components/dashboard/TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { useBets } from '@/contexts/BetContext';
import { useLayBets } from '@/contexts/LayBetContext';
import { useReminders } from '@/contexts/ReminderContext';
import { useYear } from '@/contexts/YearContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/utils/dates';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { wallets, loading: walletsLoading } = useWallets();
  const { bets, getArchivedBets, loading: betsLoading } = useBets();
  const { layBets } = useLayBets();
  const { reminders, updateReminder, loading: remindersLoading } = useReminders();
  const { selectedYear } = useYear();

  const archivedBets = getArchivedBets();
  const quickBets = bets.filter(bet => bet.tipo === 'Rapida');
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('year');

  // Force recalculation when bets change
  useEffect(() => {
    // This will trigger a re-render when bets data changes
  }, [bets]);

  // Listen to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-bets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets'
        },
        () => {
          // Data will be refreshed automatically by BetContext
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate lay bets results for archived bets
  const calculateLayBetResults = (betId: string, outcome: string, esitoDettaglio?: string) => {
    const associatedLayBets = layBets.filter(lb => lb.parentBetId === betId && lb.metodo === 'Banca' && ['In Corso', 'Vinto', 'Perso'].includes(lb.stato));
    let total = 0;
    
    associatedLayBets.forEach(lb => {
      if (outcome === 'win') {
        // Punta vinta -> bancata perde (liability)
        total -= lb.stake * (lb.quotaBanca - 1);
      } else if (outcome === 'loss') {
        if (esitoDettaglio && lb.id === esitoDettaglio) {
          // Questo lay ha vinto
          const profittoLordo = lb.stake;
          const tasse = profittoLordo * (lb.tassePercentuale / 100);
          total += profittoLordo - tasse;
        } else if (esitoDettaglio) {
          // Lay precedenti perdono
          total -= lb.stake * (lb.quotaBanca - 1);
        } else {
          // Nessun dettaglio: bancata ha vinto (punta persa generica)
          const profittoLordo = lb.stake;
          const tasse = profittoLordo * (lb.tassePercentuale / 100);
          total += profittoLordo - tasse;
        }
      }
      // refund -> 0
    });
    
    return total;
  };

  // Calculate stats from archived bets AND quick bets
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const isCurrentYear = selectedYear === currentYear;
  
  // Archived bets (escludi le quick bets per evitare doppio conteggio)
  const currentMonthArchivedBets = archivedBets.filter(
    bet => bet.tipo !== 'Rapida' &&
           bet.createdAt.getMonth() === currentMonth && 
           bet.createdAt.getFullYear() === selectedYear
  );
  
  // Include lay bets results
  const currentMonthArchivedEarnings = currentMonthArchivedBets.reduce((sum, bet) => {
    const betResult = bet.risultato || 0;
    const layResult = calculateLayBetResults(bet.id, bet.esito || 'refund', bet.esitoDettaglio);
    return sum + betResult + layResult;
  }, 0);
  
  // Quick bets for current month
  const currentMonthQuickBets = quickBets.filter(
    bet => bet.createdAt.getMonth() === currentMonth && 
           bet.createdAt.getFullYear() === selectedYear
  );
  
  const currentMonthQuickEarnings = currentMonthQuickBets.reduce((sum, bet) => sum + bet.stake, 0);
  
  // Total current month earnings (archived + quick)
  const currentMonthEarnings = isCurrentYear ? currentMonthArchivedEarnings + currentMonthQuickEarnings : 0;
  
  // Year totals (escludi le quick bets dagli archived per evitare doppio conteggio)
  const yearArchivedBets = archivedBets.filter(bet => bet.tipo !== 'Rapida' && bet.createdAt.getFullYear() === selectedYear);
  const yearQuickBets = quickBets.filter(bet => bet.createdAt.getFullYear() === selectedYear);
  
  const totalYearArchived = yearArchivedBets.reduce((sum, bet) => {
    const betResult = bet.risultato || 0;
    const layResult = calculateLayBetResults(bet.id, bet.esito || 'refund', bet.esitoDettaglio);
    return sum + betResult + layResult;
  }, 0);
  const totalYearQuick = yearQuickBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalYear = totalYearArchived + totalYearQuick;
  
  // Calculate monthly earnings for the chart (archived + quick)
  // yearArchivedBets già esclude le quick bets
  const monthlyEarnings = new Array(12).fill(0);
  yearArchivedBets.forEach(bet => {
    const month = bet.createdAt.getMonth();
    const betResult = bet.risultato || 0;
    const layResult = calculateLayBetResults(bet.id, bet.esito || 'refund', bet.esitoDettaglio);
    monthlyEarnings[month] += betResult + layResult;
  });
  yearQuickBets.forEach(bet => {
    const month = bet.createdAt.getMonth();
    monthlyEarnings[month] += bet.stake;
  });
  
  const monthlyAverage = totalYear / 12;
  const bestMonth = Math.max(...monthlyEarnings);
  const bestMonthIndex = monthlyEarnings.indexOf(bestMonth);
  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const bestMonthName = monthNames[bestMonthIndex];

  // Analytics calculations - include archived bets AND quick bets AND lay bets
  const bookmakerStats = useMemo(() => {
    const stats = new Map();
    
    // Add ALL bets (archived + ongoing)
    bets.forEach(bet => {
      if (!stats.has(bet.conto)) {
        stats.set(bet.conto, { stake: 0, profitto: 0, count: 0 });
      }
      const s = stats.get(bet.conto);
      s.stake += bet.stake;
      
      // For quick bets, profitto is the stake itself
      // For other bets, profitto is the risultato
      if (bet.tipo === 'Rapida') {
        s.profitto += bet.stake;
      } else {
        s.profitto += bet.risultato || 0;
      }
      s.count += 1;
    });

  // Add lay bets results for archived bets
  bets.filter(b => b.stato === 'Archiviata' && b.esito).forEach(bet => {
    const layBetsForBet = layBets.filter(lb => 
      lb.parentBetId === bet.id && 
      lb.metodo === 'Banca' && 
      ['Vinto', 'Perso', 'In Corso'].includes(lb.stato) // Solo bancate effettivamente giocate
    );
    
    layBetsForBet.forEach(lb => {
      if (!stats.has(lb.conto)) {
        stats.set(lb.conto, { stake: 0, profitto: 0, count: 0 });
      }
      const s = stats.get(lb.conto);
      // Add lay bet stake to total stake
      s.stake += lb.stake;
      s.count += 1;
      
      // Calcola la quota parte di questo lay
      if (bet.esito === 'win') {
        // Punta vinta -> bancata perde (liability)
        s.profitto -= lb.stake * (lb.quotaBanca - 1);
      } else if (bet.esito === 'loss' && bet.esitoDettaglio === lb.id) {
        // Questo lay ha vinto
        const profittoLordo = lb.stake;
        const tasse = profittoLordo * (lb.tassePercentuale / 100);
        s.profitto += profittoLordo - tasse;
      } else if (bet.esito === 'loss' && bet.esitoDettaglio && lb.stato === 'Perso') {
        // Lay precedenti a quello vincente perdono (solo se erano stati attivati)
        s.profitto -= lb.stake * (lb.quotaBanca - 1);
      }
    });
  });
    
    return Array.from(stats.entries()).map(([bookmaker, data]) => ({
      bookmaker,
      ...data,
      roi: data.stake > 0 ? (data.profitto / data.stake) * 100 : 0
    }));
  }, [bets, layBets]);

  const winRateRegular = useMemo(() => {
    const regularBets = archivedBets.filter(b => b.tipo !== 'Rapida');
    const wins = regularBets.filter(b => b.risultato && b.risultato > 0).length;
    return regularBets.length > 0 ? (wins / regularBets.length) * 100 : 0;
  }, [archivedBets]);

  const winRateQuick = useMemo(() => {
    const quickArchivedBets = quickBets.filter(b => b.stato === 'Archiviata');
    const wins = quickArchivedBets.filter(b => b.risultato && b.risultato > 0).length;
    return quickArchivedBets.length > 0 ? (wins / quickArchivedBets.length) * 100 : 0;
  }, [quickBets]);

  const averageOdds = useMemo(() => {
    // Exclude quick bets from average odds calculation (they don't have odds)
    const withOdds = archivedBets.filter(b => b.quota && b.tipo !== 'Rapida');
    return withOdds.length > 0 
      ? withOdds.reduce((sum, b) => sum + (b.quota || 0), 0) / withOdds.length 
      : 0;
  }, [archivedBets]);

  const currentStreak = useMemo(() => {
    const sorted = [...archivedBets].sort((a, b) => b.dataEvento.getTime() - a.dataEvento.getTime());
    let streak = 0;
    let isWinning: boolean | null = null;
    
    for (const bet of sorted) {
      const won = bet.risultato && bet.risultato > 0;
      if (isWinning === null) {
        isWinning = won;
        streak = 1;
      } else if (isWinning === won) {
        streak++;
      } else {
        break;
      }
    }
    
    return { count: streak, type: isWinning ? 'vincente' as const : 'perdente' as const };
  }, [archivedBets]);

  const overallROI = useMemo(() => {
    // Calculate total stake from all archived bets and lay bets
    const totalStakeBets = archivedBets.reduce((sum, b) => sum + b.stake, 0);
    const totalStakeLay = layBets.filter(lb => ['In Corso', 'Vinto', 'Perso'].includes(lb.stato)).reduce((sum, lb) => sum + lb.stake, 0);
    const totalStake = totalStakeBets + totalStakeLay;
    
    // Calculate total profit from archived bets
    const totalProfittoBets = archivedBets.reduce((sum, b) => sum + (b.risultato || 0), 0);
    
    // Calculate total profit from lay bets
    const totalProfittoLay = archivedBets.reduce((sum, bet) => {
      if (bet.esito) {
        const layResult = calculateLayBetResults(bet.id, bet.esito, bet.esitoDettaglio);
        return sum + layResult;
      }
      return sum;
    }, 0);
    
    const totalProfitto = totalProfittoBets + totalProfittoLay;
    return totalStake > 0 ? (totalProfitto / totalStake) * 100 : 0;
  }, [archivedBets, layBets]);




  const chartData = [
    { month: 'Gen', earnings: monthlyEarnings[0] },
    { month: 'Feb', earnings: monthlyEarnings[1] },
    { month: 'Mar', earnings: monthlyEarnings[2] },
    { month: 'Apr', earnings: monthlyEarnings[3] },
    { month: 'Mag', earnings: monthlyEarnings[4] },
    { month: 'Giu', earnings: monthlyEarnings[5] },
    { month: 'Lug', earnings: monthlyEarnings[6] },
    { month: 'Ago', earnings: monthlyEarnings[7] },
    { month: 'Set', earnings: monthlyEarnings[8] },
    { month: 'Ott', earnings: monthlyEarnings[9] },
    { month: 'Nov', earnings: monthlyEarnings[10] },
    { month: 'Dic', earnings: monthlyEarnings[11] },
  ];

  const newReminders = reminders.filter(r => r.stato === 'Nuovo');
  const readReminders = reminders.filter(r => r.stato === 'Letto');

  const handleMarkAsRead = async (id: string) => {
    await updateReminder(id, { stato: 'Letto' });
  };

  const loading = accountsLoading || walletsLoading || betsLoading || remindersLoading;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Advanced KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <AdvancedKPICard
          title="Guadagni Mese Corrente"
          value={currentMonthEarnings}
          icon={TrendingUp}
          sparklineData={monthlyEarnings.slice(0, currentMonth + 1)}
          trend={currentMonthEarnings >= monthlyAverage ? 'up' : 'down'}
        />
        <AdvancedKPICard
          title="Media Mensile"
          value={monthlyAverage}
          icon={Calendar}
          subtitle="Confronto annuale"
        />
        <AdvancedKPICard
          title="Miglior Mese"
          value={bestMonth}
          icon={Trophy}
          subtitle={bestMonth > 0 ? bestMonthName : "Nessun dato"}
          trend="up"
        />
        <AdvancedKPICard
          title={`Totale Anno ${selectedYear}`}
          value={totalYear}
          icon={Wallet}
          trend={totalYear >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Trend Chart and Messages */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2">
          <TrendChart data={chartData} title={`Trend Guadagni ${selectedYear}`} />
          {accounts.length === 0 && wallets.length === 0 && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <p className="text-center text-sm text-muted-foreground">
                  Nessun dato disponibile. Inizia aggiungendo conti e puntate.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Messages Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">I tuoi Messaggi</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="nuovi" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nuovi">
                  Nuovi {newReminders.length > 0 && `(${newReminders.length})`}
                </TabsTrigger>
                <TabsTrigger value="letti">
                  Letti {readReminders.length > 0 && `(${readReminders.length})`}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="nuovi" className="mt-4 space-y-3">
                {newReminders.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nessun messaggio nuovo
                  </p>
                ) : (
                  newReminders.map(reminder => (
                    <div key={reminder.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{reminder.metodo}</div>
                          {reminder.conto && (
                            <div className="text-xs text-muted-foreground">{reminder.conto}</div>
                          )}
                        </div>
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                          Nuovo
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{reminder.descrizione}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Scadenza: {formatDateTime(reminder.dataScadenza)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleMarkAsRead(reminder.id)}
                      >
                        Segna come letto
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>
              <TabsContent value="letti" className="mt-4 space-y-3">
                {readReminders.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nessun messaggio letto
                  </p>
                ) : (
                  readReminders.map(reminder => (
                    <div key={reminder.id} className="rounded-lg border p-3 space-y-2 opacity-60">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{reminder.metodo}</div>
                          {reminder.conto && (
                            <div className="text-xs text-muted-foreground">{reminder.conto}</div>
                          )}
                        </div>
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          Letto
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{reminder.descrizione}</p>
                      <div className="text-xs text-muted-foreground">
                        Scadenza: {formatDateTime(reminder.dataScadenza)}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis Section */}
      <div className="mb-8">
        <ROIByBookmakerChart key={JSON.stringify(bookmakerStats)} data={bookmakerStats} />
      </div>

      {/* Wallet & Bilancio */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Wallet Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wallets.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nessun wallet configurato
              </p>
            ) : (
              <div className="space-y-3">
                {wallets.map(wallet => (
                  <div key={wallet.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-semibold text-sm">{wallet.nome}</div>
                      <div className="text-xs text-muted-foreground">{wallet.intestatario}</div>
                    </div>
                    <div className={`font-bold text-sm ${wallet.saldoAttuale >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(wallet.saldoAttuale)}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-muted p-3 mt-2">
                  <span className="font-semibold text-sm">Totale Wallet</span>
                  <span className={`font-bold ${wallets.reduce((s, w) => s + (w.stato === 'Abilitato' ? w.saldoAttuale : 0), 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(wallets.reduce((s, w) => s + (w.stato === 'Abilitato' ? w.saldoAttuale : 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bilancio Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Bilancio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nessun conto configurato
              </p>
            ) : (
              <div className="space-y-3">
                {accounts.map(account => (
                  <div key={account.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-semibold text-sm">{account.conto}</div>
                      <div className="text-xs text-muted-foreground">{account.intestatario}</div>
                    </div>
                    <div className={`font-bold text-sm ${account.saldoAttuale >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(account.saldoAttuale)}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-muted p-3 mt-2">
                  <span className="font-semibold text-sm">Totale Conti</span>
                  <span className={`font-bold ${accounts.reduce((s, a) => s + (a.stato === 'Abilitato' ? a.saldoAttuale : 0), 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(accounts.reduce((s, a) => s + (a.stato === 'Abilitato' ? a.saldoAttuale : 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

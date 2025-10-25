import { useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, Trophy, Wallet, BarChart3, PieChart } from 'lucide-react';
import { AdvancedKPICard } from '@/components/dashboard/AdvancedKPICard';
import { ROIByBookmakerChart } from '@/components/dashboard/ROIByBookmakerChart';
import { PerformanceMetricsCard } from '@/components/dashboard/PerformanceMetricsCard';
import { BetTypeDistributionChart } from '@/components/dashboard/BetTypeDistributionChart';
import { MonthlyComparisonChart } from '@/components/dashboard/MonthlyComparisonChart';
import { QuickInsightsPanel, generateInsights } from '@/components/dashboard/QuickInsightsPanel';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { useBets } from '@/contexts/BetContext';
import { useReminders } from '@/contexts/ReminderContext';
import { useYear } from '@/contexts/YearContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/utils/dates';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { wallets, loading: walletsLoading } = useWallets();
  const { bets, getArchivedBets, loading: betsLoading } = useBets();
  const { reminders, updateReminder, loading: remindersLoading } = useReminders();
  const { selectedYear } = useYear();

  const archivedBets = getArchivedBets();
  const quickBets = bets.filter(bet => bet.tipo === 'Rapida');

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
  
  const currentMonthArchivedEarnings = currentMonthArchivedBets.reduce((sum, bet) => sum + (bet.risultato || 0), 0);
  
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
  
  const totalYearArchived = yearArchivedBets.reduce((sum, bet) => sum + (bet.risultato || 0), 0);
  const totalYearQuick = yearQuickBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalYear = totalYearArchived + totalYearQuick;
  
  // Calculate monthly earnings for the chart (archived + quick)
  // yearArchivedBets già esclude le quick bets
  const monthlyEarnings = new Array(12).fill(0);
  yearArchivedBets.forEach(bet => {
    const month = bet.createdAt.getMonth();
    monthlyEarnings[month] += (bet.risultato || 0);
  });
  yearQuickBets.forEach(bet => {
    const month = bet.createdAt.getMonth();
    monthlyEarnings[month] += bet.stake;
  });
  
  const monthlyAverage = totalYear / 12;
  const bestMonth = Math.max(...monthlyEarnings);

  // Analytics calculations - include archived bets AND quick bets
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
    
    return Array.from(stats.entries()).map(([bookmaker, data]) => ({
      bookmaker,
      ...data,
      roi: data.stake > 0 ? (data.profitto / data.stake) * 100 : 0
    }));
  }, [bets]);

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
    const totalStake = archivedBets.reduce((sum, b) => sum + b.stake, 0);
    const totalProfitto = archivedBets.reduce((sum, b) => sum + (b.risultato || 0), 0);
    return totalStake > 0 ? (totalProfitto / totalStake) * 100 : 0;
  }, [archivedBets]);

  const betTypeDistribution = useMemo(() => {
    const types = new Map();
    bets.forEach(bet => {
      if (!types.has(bet.tipo)) {
        types.set(bet.tipo, { value: 0, count: 0 });
      }
      const t = types.get(bet.tipo);
      t.value += bet.stake;
      t.count += 1;
    });
    
    const total = Array.from(types.values()).reduce((sum, t) => sum + t.value, 0);
    return Array.from(types.entries()).map(([name, data]) => ({
      name,
      ...data,
      percentage: total > 0 ? (data.value / total) * 100 : 0
    }));
  }, [bets]);

  const insights = useMemo(() => generateInsights(bets, selectedYear), [bets, selectedYear]);

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
          subtitle="Performance massima"
          trend="up"
        />
        <AdvancedKPICard
          title={`Totale Anno ${selectedYear}`}
          value={totalYear}
          icon={Wallet}
          trend={totalYear >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Performance Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <PerformanceMetricsCard
          winRateRegular={winRateRegular}
          winRateQuick={winRateQuick}
          averageOdds={averageOdds}
          currentStreak={currentStreak}
          overallROI={overallROI}
        />
        <div className="lg:col-span-2">
          <ROIByBookmakerChart data={bookmakerStats} />
        </div>
      </div>

      {/* Distribution & Insights */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <BetTypeDistributionChart data={betTypeDistribution} />
        <QuickInsightsPanel insights={insights} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
    </div>
  );
}

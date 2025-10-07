import { useEffect } from 'react';
import { TrendingUp, Calendar, Trophy, Wallet } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { useBets } from '@/contexts/BetContext';

export default function Dashboard() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { wallets, loading: walletsLoading } = useWallets();
  const { getArchivedBets, loading: betsLoading } = useBets();

  const archivedBets = getArchivedBets();

  // Calculate stats from archived bets
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthBets = archivedBets.filter(
    bet => bet.createdAt.getMonth() === currentMonth && 
           bet.createdAt.getFullYear() === currentYear
  );
  
  const currentMonthEarnings = currentMonthBets.reduce((sum, bet) => sum + (bet.risultato || 0), 0);
  
  const yearBets = archivedBets.filter(bet => bet.createdAt.getFullYear() === currentYear);
  const totalYear = yearBets.reduce((sum, bet) => sum + (bet.risultato || 0), 0);
  
  // Calculate monthly earnings for the chart
  const monthlyEarnings = new Array(12).fill(0);
  yearBets.forEach(bet => {
    const month = bet.createdAt.getMonth();
    monthlyEarnings[month] += (bet.risultato || 0);
  });
  
  const monthlyAverage = totalYear / 12;
  const bestMonth = Math.max(...monthlyEarnings);

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

  const loading = accountsLoading || walletsLoading || betsLoading;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Guadagni Mese Corrente"
          value={currentMonthEarnings}
          change={0}
          icon={TrendingUp}
        />
        <KPICard
          title="Media Mensile"
          value={monthlyAverage}
          icon={Calendar}
          subtitle="Confronto annuale"
        />
        <KPICard
          title="Miglior Mese"
          value={bestMonth}
          icon={Trophy}
          subtitle="vs media"
        />
        <KPICard
          title="Totale Anno 2025"
          value={totalYear}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <div className="lg:col-span-2">
          <TrendChart data={chartData} title="Trend Guadagni 2025" />
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
                <TabsTrigger value="nuovi">Nuovi</TabsTrigger>
                <TabsTrigger value="letti">Letti</TabsTrigger>
              </TabsList>
              <TabsContent value="nuovi" className="mt-4">
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nessun messaggio nuovo
                </p>
              </TabsContent>
              <TabsContent value="letti" className="mt-4">
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nessun messaggio letto
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

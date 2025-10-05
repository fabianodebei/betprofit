import { TrendingUp, Calendar, Trophy, Wallet } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { useBets } from '@/contexts/BetContext';

export default function Dashboard() {
  const { accounts } = useAccounts();
  const { wallets } = useWallets();
  const { getArchivedBets } = useBets();

  const archivedBets = getArchivedBets();

  // Calculate stats
  const currentMonthEarnings = 0;
  const monthlyAverage = 0;
  const bestMonth = 0;
  const totalYear = 0;

  const chartData = [
    { month: 'Gen', earnings: 0 },
    { month: 'Feb', earnings: 0 },
    { month: 'Mar', earnings: 0 },
    { month: 'Apr', earnings: 0 },
    { month: 'Mag', earnings: 0 },
    { month: 'Giu', earnings: 0 },
    { month: 'Lug', earnings: 0 },
    { month: 'Ago', earnings: 0 },
    { month: 'Set', earnings: 0 },
    { month: 'Ott', earnings: 0 },
    { month: 'Nov', earnings: 0 },
    { month: 'Dic', earnings: 0 },
  ];

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

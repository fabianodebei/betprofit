import { memo } from 'react';
import { Users, Activity, Database, TrendingUp } from 'lucide-react';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { UserRegistrationChart } from '@/components/admin/UserRegistrationChart';
import { UserEarningsChart } from '@/components/admin/UserEarningsChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SystemStats {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsers: number;
  totalBets: number;
  totalTransactions: number;
  totalAccounts: number;
  totalWallets: number;
  totalTags: number;
  roleDistribution: {
    admin: number;
    free: number;
  };
}

interface WidgetsProps {
  systemStats: SystemStats | null;
  registrationData: any[];
  userEarnings: any[];
}

/**
 * Memoized widget components to prevent unnecessary re-renders
 * Each widget is memoized individually for optimal performance
 */
export const KPIUsersWidget = memo(({ systemStats }: Pick<WidgetsProps, 'systemStats'>) => (
  <AdminKPICard
    title="Totale Utenti"
    value={systemStats?.totalUsers || 0}
    icon={Users}
    trend={{
      value: systemStats?.newUsersThisWeek || 0,
      label: 'questa settimana'
    }}
  />
));

export const KPIBetsWidget = memo(({ systemStats }: Pick<WidgetsProps, 'systemStats'>) => (
  <AdminKPICard
    title="Utenti Attivi"
    value={systemStats?.activeUsers || 0}
    icon={Activity}
    description="Ultimi 30 giorni"
  />
));

export const KPITransactionsWidget = memo(({ systemStats }: Pick<WidgetsProps, 'systemStats'>) => (
  <AdminKPICard
    title="Nuovi Utenti"
    value={systemStats?.newUsersThisMonth || 0}
    icon={TrendingUp}
    description="Ultimo mese"
  />
));

export const KPIAccountsWidget = memo(({ systemStats }: Pick<WidgetsProps, 'systemStats'>) => (
  <AdminKPICard
    title="Database"
    value={`${systemStats?.totalBets || 0} bets`}
    icon={Database}
    description={`${systemStats?.totalTransactions || 0} transazioni`}
  />
));

export const RegistrationChartWidget = memo(({ registrationData }: Pick<WidgetsProps, 'registrationData'>) => (
  <UserRegistrationChart data={registrationData} height={350} />
));

export const EarningsChartWidget = memo(({ userEarnings }: Pick<WidgetsProps, 'userEarnings'>) => (
  <UserEarningsChart data={userEarnings} height={350} />
));

export const StatsGeneralWidget = memo(({ systemStats }: Pick<WidgetsProps, 'systemStats'>) => (
  <Card>
    <CardHeader>
      <CardTitle>Statistiche Database</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Bets</span>
        <span className="font-semibold">{systemStats?.totalBets || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Transazioni</span>
        <span className="font-semibold">{systemStats?.totalTransactions || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Conti</span>
        <span className="font-semibold">{systemStats?.totalAccounts || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Wallet</span>
        <span className="font-semibold">{systemStats?.totalWallets || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tag</span>
        <span className="font-semibold">{systemStats?.totalTags || 0}</span>
      </div>
    </CardContent>
  </Card>
));

export const StatsBetsWidget = memo(({ systemStats }: Pick<WidgetsProps, 'systemStats'>) => (
  <Card>
    <CardHeader>
      <CardTitle>Distribuzione Ruoli</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Admin</span>
        <Badge variant="default">{systemStats?.roleDistribution.admin || 0}</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Free</span>
        <Badge variant="outline">{systemStats?.roleDistribution.free || 0}</Badge>
      </div>
    </CardContent>
  </Card>
));

export const StatsAccountsWidget = memo(({ systemStats }: Pick<WidgetsProps, 'systemStats'>) => (
  <Card>
    <CardHeader>
      <CardTitle>Crescita Utenti</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Questa settimana</span>
        <span className="font-semibold text-success">+{systemStats?.newUsersThisWeek || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Questo mese</span>
        <span className="font-semibold text-success">+{systemStats?.newUsersThisMonth || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Attivi (30gg)</span>
        <span className="font-semibold">{systemStats?.activeUsers || 0}</span>
      </div>
    </CardContent>
  </Card>
));

// Display names for better debugging
KPIUsersWidget.displayName = 'KPIUsersWidget';
KPIBetsWidget.displayName = 'KPIBetsWidget';
KPITransactionsWidget.displayName = 'KPITransactionsWidget';
KPIAccountsWidget.displayName = 'KPIAccountsWidget';
RegistrationChartWidget.displayName = 'RegistrationChartWidget';
EarningsChartWidget.displayName = 'EarningsChartWidget';
StatsGeneralWidget.displayName = 'StatsGeneralWidget';
StatsBetsWidget.displayName = 'StatsBetsWidget';
StatsAccountsWidget.displayName = 'StatsAccountsWidget';

import { Users, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';

interface PlatformKPICardsProps {
  totalUsers: number;
  activeUsers: number;
  totalBets: number;
  totalEarnings: number;
  newUsersMonth: number;
}

interface KPIItemProps {
  label: string;
  value: string;
  icon: React.ElementType;
  accentColor: string;
  subtext?: string;
}

const KPIItem = ({ label, value, icon: Icon, accentColor, subtext }: KPIItemProps) => (
  <div className="relative overflow-hidden rounded-xl border border-border/30 bg-[hsl(220,30%,10%)] p-4 md:p-5">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
      <div className={cn("p-2.5 rounded-lg", accentColor)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {/* Decorative gradient */}
    <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", accentColor.replace('bg-', 'bg-gradient-to-r from-transparent via-').replace('/15', '').replace(' text-', ' to-transparent opacity-50 '))} />
  </div>
);

export const PlatformKPICards = ({ totalUsers, activeUsers, totalBets, totalEarnings, newUsersMonth }: PlatformKPICardsProps) => {
  const annualRevenue = totalUsers * 899;
  const mrr = annualRevenue / 12;
  const newMRR = newUsersMonth * (899 / 12);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
      <KPIItem
        label="Utenti Totali"
        value={String(totalUsers)}
        icon={Users}
        accentColor="bg-primary/15 text-primary"
        subtext={`+${newUsersMonth} questo mese`}
      />
      <KPIItem
        label="Utenti Attivi"
        value={String(activeUsers)}
        icon={Activity}
        accentColor="bg-info/15 text-info"
        subtext="Ultimi 30 giorni"
      />
      <KPIItem
        label="Revenue Totale"
        value={formatCurrency(annualRevenue)}
        icon={DollarSign}
        accentColor="bg-success/15 text-success"
        subtext={`${totalUsers} × €899/anno`}
      />
      <KPIItem
        label="MRR"
        value={formatCurrency(mrr)}
        icon={TrendingUp}
        accentColor="bg-accent/15 text-accent"
        subtext={`+${formatCurrency(newMRR)} nuovo`}
      />
      <KPIItem
        label="Bets Totali"
        value={totalBets.toLocaleString('it-IT')}
        icon={BarChart3}
        accentColor="bg-chart-3/15 text-info"
      />
      <KPIItem
        label="Churn Rate"
        value={totalUsers > 0 ? `${Math.max(0, ((totalUsers - activeUsers) / totalUsers * 100)).toFixed(1)}%` : '0%'}
        icon={TrendingUp}
        accentColor="bg-warning/15 text-warning"
        subtext="Inattivi / Totali"
      />
    </div>
  );
};

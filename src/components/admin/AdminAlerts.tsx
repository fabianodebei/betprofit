import { AlertTriangle, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

interface AdminAlertsProps {
  totalBets: number;
  activeUsers: number;
  userEarnings: { email: string; total_earnings: number }[];
}

export const AdminAlerts = ({ totalBets, activeUsers, userEarnings }: AdminAlertsProps) => {
  const alerts: Alert[] = [];

  // High-volume users alert
  const highEarners = userEarnings.filter(u => Number(u.total_earnings) > 1000);
  if (highEarners.length > 0) {
    alerts.push({
      id: 'high-volume',
      type: 'warning',
      title: 'Utenti alto volume',
      message: `${highEarners.length} utent${highEarners.length === 1 ? 'e' : 'i'} con profitto > €1.000`,
    });
  }

  // Milestone alerts
  if (totalBets > 0 && totalBets % 100 === 0) {
    alerts.push({
      id: 'bets-milestone',
      type: 'success',
      title: 'Milestone raggiunto!',
      message: `${totalBets} scommesse totali sulla piattaforma`,
    });
  }

  if (activeUsers >= 10) {
    alerts.push({
      id: 'active-milestone',
      type: 'info',
      title: 'Utenti attivi in crescita',
      message: `${activeUsers} utenti attivi negli ultimi 30 giorni`,
    });
  }

  if (alerts.length === 0) return null;

  const iconMap = {
    warning: AlertTriangle,
    success: Trophy,
    info: TrendingUp,
  };

  const colorMap = {
    warning: 'border-warning/30 bg-warning/5 text-warning',
    success: 'border-success/30 bg-success/5 text-success',
    info: 'border-info/30 bg-info/5 text-info',
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const Icon = iconMap[alert.type];
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border text-sm",
              colorMap[alert.type]
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <div>
              <span className="font-semibold">{alert.title}:</span>{' '}
              <span className="opacity-80">{alert.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

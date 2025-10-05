import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';

interface KPICardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  subtitle?: string;
}

export function KPICard({ title, value, change, icon: Icon, subtitle }: KPICardProps) {
  const hasChange = typeof change === 'number' && !isNaN(change);
  const isPositive = hasChange && change > 0;
  const isNegative = hasChange && change < 0;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {formatCurrency(value)}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {hasChange && (
              <div className="mt-2 flex items-center gap-1">
                {isPositive && <TrendingUp className="h-4 w-4 text-success" />}
                {isNegative && <TrendingDown className="h-4 w-4 text-destructive" />}
                <span
                  className={`text-sm font-medium ${
                    isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                >
                  {isPositive && '+'}
                  {change.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs mese prec.</span>
              </div>
            )}
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

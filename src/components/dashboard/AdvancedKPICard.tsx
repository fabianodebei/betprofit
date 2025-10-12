import { LucideIcon, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface AdvancedKPICardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  subtitle?: string;
  sparklineData?: number[];
  trend?: 'up' | 'down' | 'neutral';
}

export function AdvancedKPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  subtitle,
  sparklineData,
  trend = 'neutral'
}: AdvancedKPICardProps) {
  const hasChange = typeof change === 'number' && !isNaN(change);
  const isPositive = hasChange && change > 0;
  const isNegative = hasChange && change < 0;

  const chartData = sparklineData?.map((val, idx) => ({ value: val, index: idx })) || [];

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
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
          </div>
          <div className={`rounded-full p-3 ${
            trend === 'up' ? 'bg-success/10' :
            trend === 'down' ? 'bg-destructive/10' :
            'bg-primary/10'
          }`}>
            <Icon className={`h-6 w-6 ${
              trend === 'up' ? 'text-success' :
              trend === 'down' ? 'text-destructive' :
              'text-primary'
            }`} />
          </div>
        </div>

        {/* Sparkline Chart */}
        {chartData.length > 0 && (
          <div className="h-12 -mx-2 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={trend === 'up' ? 'hsl(var(--success))' : trend === 'down' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Change Indicator */}
        {hasChange && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <div className={`flex items-center gap-1 ${
              isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {isPositive ? <ArrowUp className="h-3 w-3" /> : isNegative ? <ArrowDown className="h-3 w-3" /> : null}
              <span className="text-sm font-semibold">
                {isPositive && '+'}
                {change.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">vs periodo precedente</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

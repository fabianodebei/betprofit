import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrency } from '@/utils/currency';

export type TrendPeriod = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  label: string;
  earnings: number;
}

interface TrendChartProps {
  data: ChartDataPoint[];
  title: string;
  period: TrendPeriod;
  onPeriodChange: (period: TrendPeriod) => void;
}

export function TrendChart({ data, title, period, onPeriodChange }: TrendChartProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(val) => val && onPeriodChange(val as TrendPeriod)}
          size="sm"
        >
          <ToggleGroupItem value="day" className="text-xs px-3">Giorno</ToggleGroupItem>
          <ToggleGroupItem value="week" className="text-xs px-3">Settimana</ToggleGroupItem>
          <ToggleGroupItem value="month" className="text-xs px-3">Mese</ToggleGroupItem>
          <ToggleGroupItem value="year" className="text-xs px-3">Anno</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="label" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: 12 }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Guadagni']}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  fill="url(#colorEarnings)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Nessun dato disponibile per il grafico</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

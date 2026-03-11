import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FullscreenChart } from './FullscreenChart';
import { formatCurrency } from '@/utils/currency';

interface UserEarningsChartProps {
  data: {
    email: string;
    full_name: string | null;
    total_earnings: number;
  }[];
  height?: number;
}

export const UserEarningsChart = ({ data, height = 300 }: UserEarningsChartProps) => {
  // Format data for the chart - show top 10 users
  const chartData = data.slice(0, 10).map(user => ({
    name: user.full_name || user.email.split('@')[0],
    earnings: Number(user.total_earnings),
    isPositive: Number(user.total_earnings) >= 0,
  }));

  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => `€${value}`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--popover-foreground))',
          }}
          labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
          itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          formatter={(value: number) => [formatCurrency(value), 'Guadagno']}
        />
        <Bar dataKey="earnings" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`}
              fill={entry.isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Guadagni Utenti (Top 10)</CardTitle>
        <FullscreenChart title="Guadagni Utenti (Top 10)">
          {chartContent}
        </FullscreenChart>
      </CardHeader>
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FullscreenChart } from './FullscreenChart';

interface BookmakerDistributionChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

const COLORS = [
  'hsl(354, 70%, 54%)',
  'hsl(38, 45%, 60%)',
  'hsl(210, 100%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(280, 60%, 55%)',
  'hsl(30, 80%, 55%)',
  'hsl(180, 60%, 45%)',
  'hsl(320, 60%, 50%)',
];

export const BookmakerDistributionChart = ({ data, height = 300 }: BookmakerDistributionChartProps) => {
  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={height / 4}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(220, 30%, 12%)',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
          }}
          formatter={(value: number) => [`${value} bets`, 'Volume']}
        />
        <Legend
          wrapperStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Card className="border-border/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Distribuzione Bookmaker</CardTitle>
        <FullscreenChart title="Distribuzione Bookmaker">
          {chartContent}
        </FullscreenChart>
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
  );
};

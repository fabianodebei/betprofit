import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/currency';

interface BetTypeData {
  name: string;
  value: number;
  count: number;
  percentage: number;
}

interface BetTypeDistributionChartProps {
  data: BetTypeData[];
}

const COLORS = {
  'Singola': 'hsl(var(--chart-1))',
  'Multipla': 'hsl(var(--chart-2))',
  'Casino': 'hsl(var(--chart-3))',
  'Rapida': 'hsl(var(--chart-4))',
};

export function BetTypeDistributionChart({ data }: BetTypeDistributionChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-xl">
          <p className="font-semibold text-sm mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">
              Stake: <span className="font-semibold">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-muted-foreground">
              N° Scommesse: <span className="font-semibold">{data.count}</span>
            </p>
            <p className="text-muted-foreground">
              Percentuale: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione Tipi Scommessa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-8">
            Nessun dato disponibile
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuzione Tipi Scommessa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || 'hsl(var(--primary))'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

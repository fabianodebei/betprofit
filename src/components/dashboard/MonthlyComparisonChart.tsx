import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/utils/currency';

interface MonthlyComparisonData {
  month: string;
  currentYear: number;
  previousYear: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyComparisonData[];
  currentYear: number;
  previousYear: number;
}

export function MonthlyComparisonChart({ data, currentYear, previousYear }: MonthlyComparisonChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-xl">
          <p className="font-semibold text-sm mb-2">{data.month}</p>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">
              {currentYear}: <span className="font-semibold text-primary">{formatCurrency(data.currentYear)}</span>
            </p>
            <p className="text-muted-foreground">
              {previousYear}: <span className="font-semibold text-muted-foreground">{formatCurrency(data.previousYear)}</span>
            </p>
            <p className="text-muted-foreground border-t pt-1 mt-1">
              Differenza: <span className={`font-semibold ${data.currentYear - data.previousYear >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(data.currentYear - data.previousYear)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confronto Anno su Anno</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="currentYear" name={`${currentYear}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="previousYear" name={`${previousYear}`} fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

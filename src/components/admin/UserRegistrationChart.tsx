import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FullscreenChart } from './FullscreenChart';

interface UserRegistrationChartProps {
  data: {
    date: string;
    count: number;
  }[];
  height?: number;
}

export const UserRegistrationChart = ({ data, height = 300 }: UserRegistrationChartProps) => {
  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))"
          opacity={0.3}
        />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--popover-foreground))',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          labelFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('it-IT');
          }}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="hsl(var(--chart-1))" 
          strokeWidth={2}
          name="Nuovi utenti"
          dot={{ fill: 'hsl(var(--chart-1))', r: 3 }}
          activeDot={{ r: 5, fill: 'hsl(var(--chart-1))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Registrazioni Utenti (Ultimi 30 giorni)</CardTitle>
        <FullscreenChart title="Registrazioni Utenti (Ultimi 30 giorni)">
          {chartContent}
        </FullscreenChart>
      </CardHeader>
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FullscreenChart } from './FullscreenChart';

interface RoleDistributionChartProps {
  data: {
    name: string;
    value: number;
  }[];
  height?: number;
}

const COLORS = {
  'Admin': 'hsl(var(--chart-1))',
  'Premium': 'hsl(var(--chart-2))',
  'Free': 'hsl(var(--chart-3))',
};

export const RoleDistributionChart = ({ data, height = 300 }: RoleDistributionChartProps) => {
  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={height / 4}
          fill="hsl(var(--chart-1))"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[entry.name as keyof typeof COLORS]} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Legend 
          wrapperStyle={{
            color: 'hsl(var(--foreground))',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Distribuzione Ruoli</CardTitle>
        <FullscreenChart title="Distribuzione Ruoli">
          {chartContent}
        </FullscreenChart>
      </CardHeader>
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  );
};

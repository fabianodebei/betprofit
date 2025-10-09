import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RoleDistributionChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = {
  'Admin': 'hsl(var(--primary))',
  'Premium': 'hsl(var(--secondary))',
  'Free': 'hsl(var(--muted))',
};

export const RoleDistributionChart = ({ data }: RoleDistributionChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuzione Ruoli</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

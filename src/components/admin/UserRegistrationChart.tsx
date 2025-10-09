import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserRegistrationChartProps {
  data: {
    date: string;
    count: number;
  }[];
}

export const UserRegistrationChart = ({ data }: UserRegistrationChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrazioni Utenti (Ultimi 30 giorni)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('it-IT');
              }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Nuovi utenti"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

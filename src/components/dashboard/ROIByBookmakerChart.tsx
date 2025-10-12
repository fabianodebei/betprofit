import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/utils/currency';
interface BookmakerStat {
  bookmaker: string;
  stake: number;
  profitto: number;
  roi: number;
  count: number;
}
interface ROIByBookmakerChartProps {
  data: BookmakerStat[];
}
export function ROIByBookmakerChart({
  data
}: ROIByBookmakerChartProps) {
  const sortedData = [...data].sort((a, b) => b.roi - a.roi);
  const CustomTooltip = ({
    active,
    payload
  }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return <div className="rounded-lg border bg-background p-3 shadow-xl">
          <p className="font-semibold text-sm mb-2">{data.bookmaker}</p>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">
              ROI: <span className={`font-semibold ${data.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                {data.roi.toFixed(2)}%
              </span>
            </p>
            <p className="text-muted-foreground">
              Profitto: <span className="font-semibold">{formatCurrency(data.profitto)}</span>
            </p>
            <p className="text-muted-foreground">
              Stake totale: <span className="font-semibold">{formatCurrency(data.stake)}</span>
            </p>
            <p className="text-muted-foreground">
              N° Scommesse: <span className="font-semibold">{data.count}</span>
            </p>
          </div>
        </div>;
    }
    return null;
  };
  if (sortedData.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>ROI per Bookmaker</CardTitle>
        </CardHeader>
        <CardContent className="py-[120px]">
          <p className="text-center text-sm text-muted-foreground py-8">
            Nessun dato disponibile
          </p>
        </CardContent>
      </Card>;
  }
  return <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>ROI per Bookmaker</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="horizontal">
            <XAxis type="number" />
            <YAxis dataKey="bookmaker" type="category" width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.roi >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>;
}
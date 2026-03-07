import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FullscreenChart } from '@/components/admin/FullscreenChart';
import { useState, useEffect } from 'react';
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
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Calculate dynamic width based on number of bookmakers and screen size
  const dynamicWidth = Math.max(isMobile ? 400 : 800, sortedData.length * (isMobile ? 60 : 80));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{data.bookmaker}</p>
          <div className="space-y-1 text-sm">
            <p className={`font-bold ${data.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
              ROI: {data.roi.toFixed(2)}%
            </p>
            <p className="text-muted-foreground">Profitto: €{data.profitto.toFixed(2)}</p>
            <p className="text-muted-foreground">Stake: €{data.stake.toFixed(2)}</p>
            <p className="text-muted-foreground">Operazioni: {data.count}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartContent = (
    <ScrollArea className="w-full">
      <div style={{ width: dynamicWidth, minHeight: isMobile ? 300 : 400 }}>
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
          <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="bookmaker" 
              angle={-45} 
              textAnchor="end" 
              height={isMobile ? 80 : 100}
              tick={({ x, y, payload }: any) => {
                const entry = sortedData.find(d => d.bookmaker === payload.value);
                const color = entry && entry.roi < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))';
                return (
                  <text x={x} y={y} textAnchor="end" fill={color} fontSize={isMobile ? 10 : 12} transform={`rotate(-45, ${x}, ${y})`}>
                    {payload.value}
                  </text>
                );
              }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              label={{ 
                value: 'ROI %', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 12 }
              }}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
            <Bar dataKey="roi">
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.roi >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ScrollArea>
  );

  if (sortedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ROI per Bookmaker</CardTitle>
        </CardHeader>
        <CardContent className="py-[120px]">
          <p className="text-center text-sm text-muted-foreground py-8">
            Nessun dato disponibile
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">ROI per Bookmaker</CardTitle>
        <FullscreenChart title="ROI per Bookmaker">
          {chartContent}
        </FullscreenChart>
      </CardHeader>
      <CardContent className="flex-1 px-2 sm:px-6">
        {chartContent}
      </CardContent>
    </Card>
  );
}
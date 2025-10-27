import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
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

  const chartContent = (
    <ScrollArea className="w-full">
      <div style={{ width: dynamicWidth, minHeight: isMobile ? 300 : 400 }}>
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
          <BarChart data={sortedData}>
            <XAxis 
              dataKey="bookmaker" 
              angle={-45} 
              textAnchor="end" 
              height={isMobile ? 80 : 100}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 12 }}
            />
            <YAxis 
              label={{ 
                value: 'ROI %', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 12 }
              }}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 12 }}
            />
            <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
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
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>ROI per Bookmaker</CardTitle>
        <FullscreenChart title="ROI per Bookmaker">
          {chartContent}
        </FullscreenChart>
      </CardHeader>
      <CardContent className="flex-1">
        {chartContent}
      </CardContent>
    </Card>
  );
}
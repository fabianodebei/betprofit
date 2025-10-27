import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Zap, Percent } from 'lucide-react';

interface PerformanceMetricsCardProps {
  winRateRegular: number;
  winRateQuick: number;
  averageOdds: number;
  currentStreak: { count: number; type: 'vincente' | 'perdente' };
  overallROI: number;
}

export function PerformanceMetricsCard({ 
  winRateRegular,
  winRateQuick,
  averageOdds, 
  currentStreak, 
  overallROI 
}: PerformanceMetricsCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Metriche Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Win Rate Puntate</p>
              <p className="text-xs text-muted-foreground">Singole/Multiple/Casino</p>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-xl sm:text-2xl font-bold">{winRateRegular.toFixed(1)}%</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Win Rate Rapide</p>
              <p className="text-xs text-muted-foreground">Giocate rapide</p>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-xl sm:text-2xl font-bold">{winRateQuick.toFixed(1)}%</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Quota Media</p>
              <p className="text-xs text-muted-foreground">Media quote giocate</p>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-xl sm:text-2xl font-bold">{averageOdds.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${
              currentStreak.type === 'vincente' ? 'bg-success/10' : 'bg-destructive/10'
            }`}>
              <Zap className={`h-4 w-4 sm:h-5 sm:w-5 ${
                currentStreak.type === 'vincente' ? 'text-success' : 'text-destructive'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium">Streak Attuale</p>
              <p className="text-xs text-muted-foreground">
                {currentStreak.count} {currentStreak.type === 'vincente' ? 'vittorie' : 'sconfitte'} consecutive
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className={`text-xl sm:text-2xl font-bold ${
              currentStreak.type === 'vincente' ? 'text-success' : 'text-destructive'
            }`}>
              {currentStreak.count}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${
              overallROI >= 0 ? 'bg-success/10' : 'bg-destructive/10'
            }`}>
              <Percent className={`h-4 w-4 sm:h-5 sm:w-5 ${
                overallROI >= 0 ? 'text-success' : 'text-destructive'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium">ROI Complessivo</p>
              <p className="text-xs text-muted-foreground">Return on Investment</p>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className={`text-xl sm:text-2xl font-bold ${
              overallROI >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {overallROI.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

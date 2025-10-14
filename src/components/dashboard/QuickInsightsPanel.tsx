import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Tag, Calendar, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface Insight {
  type: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface QuickInsightsPanelProps {
  insights: Insight[];
}

export function QuickInsightsPanel({ insights }: QuickInsightsPanelProps) {
  const getIconColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'text-success bg-success/10';
      case 'warning':
        return 'text-destructive bg-destructive/10';
      case 'info':
        return 'text-primary bg-primary/10';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights Automatici</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Non ci sono ancora dati sufficienti per generare insights
          </p>
        ) : (
          insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className={`rounded-full p-2 ${getIconColor(insight.type)}`}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">{insight.title}</p>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function generateInsights(bets: any[], currentYear: number) {
  const insights: Insight[] = [];
  
  const archivedBets = bets.filter(b => b.stato === 'Archiviata' && b.createdAt.getFullYear() === currentYear);
  
  if (archivedBets.length === 0) return insights;

  // Best bookmaker by ROI
  const bookmakerStats = new Map();
  archivedBets.forEach(bet => {
    if (!bookmakerStats.has(bet.conto)) {
      bookmakerStats.set(bet.conto, { stake: 0, profitto: 0, count: 0 });
    }
    const s = bookmakerStats.get(bet.conto);
    s.stake += bet.stake;
    s.profitto += bet.risultato || 0;
    s.count += 1;
  });

  // Filter bookmakers with at least 3 bets
  const validBookmakers = Array.from(bookmakerStats.entries())
    .filter(([_, data]) => data.count >= 3)
    .map(([name, data]) => ({
      name,
      roi: (data.profitto / data.stake) * 100,
      profitto: data.profitto,
      count: data.count
    }));

  if (validBookmakers.length > 0) {
    const positiveBookmakers = validBookmakers.filter(b => b.roi > 0);
    
    if (positiveBookmakers.length > 0) {
      // Show best profitable bookmaker
      const best = positiveBookmakers.reduce((max, b) => b.roi > max.roi ? b : max);
      insights.push({
        type: 'success',
        icon: <Trophy className="h-4 w-4" />,
        title: `Miglior Bookmaker: ${best.name}`,
        description: `ROI del ${best.roi.toFixed(1)}% con un profitto di ${formatCurrency(best.profitto)} (${best.count} scommesse)`
      });
    } else {
      // All bookmakers are negative - show least bad as warning
      const leastBad = validBookmakers.reduce((max, b) => b.roi > max.roi ? b : max);
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: `Bookmaker con perdita minore: ${leastBad.name}`,
        description: `ROI del ${leastBad.roi.toFixed(1)}% con una perdita di ${formatCurrency(Math.abs(leastBad.profitto))} - Valuta la tua strategia`
      });
    }
  }

  // Best tag by profitability
  const tagStats = new Map();
  archivedBets.filter(b => b.tag).forEach(bet => {
    if (!tagStats.has(bet.tag)) {
      tagStats.set(bet.tag, { profitto: 0, count: 0, stake: 0 });
    }
    const s = tagStats.get(bet.tag);
    s.profitto += bet.risultato || 0;
    s.count += 1;
    s.stake += bet.stake;
  });

  // Filter tags with at least 3 bets
  const validTags = Array.from(tagStats.entries())
    .filter(([_, data]) => data.count >= 3)
    .map(([name, data]) => ({
      name,
      profitto: data.profitto,
      count: data.count,
      roi: (data.profitto / data.stake) * 100
    }));

  if (validTags.length > 0) {
    const positiveTags = validTags.filter(t => t.profitto > 0);
    
    if (positiveTags.length > 0) {
      // Show most profitable tag
      const best = positiveTags.reduce((max, t) => t.profitto > max.profitto ? t : max);
      insights.push({
        type: 'success',
        icon: <Tag className="h-4 w-4" />,
        title: `Tag più redditizio: ${best.name}`,
        description: `${best.count} scommesse per un profitto di ${formatCurrency(best.profitto)} (ROI ${best.roi.toFixed(1)}%)`
      });
    } else {
      // All tags are negative - show least bad as warning
      const leastBad = validTags.reduce((max, t) => t.profitto > max.profitto ? t : max);
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: `Tag con perdita minore: ${leastBad.name}`,
        description: `${leastBad.count} scommesse con una perdita di ${formatCurrency(Math.abs(leastBad.profitto))} - Rivaluta questo approccio`
      });
    }
  }

  // Current streak
  const sorted = [...archivedBets].sort((a, b) => b.dataEvento.getTime() - a.dataEvento.getTime());
  let streak = 0;
  let streakType: 'vincente' | 'perdente' | null = null;
  
  for (const bet of sorted) {
    const won = bet.risultato && bet.risultato > 0;
    if (streakType === null) {
      streakType = won ? 'vincente' : 'perdente';
      streak = 1;
    } else if ((streakType === 'vincente' && won) || (streakType === 'perdente' && !won)) {
      streak++;
    } else {
      break;
    }
  }

  if (streak >= 3) {
    insights.push({
      type: streakType === 'vincente' ? 'success' : 'warning',
      icon: <TrendingUp className="h-4 w-4" />,
      title: `Streak ${streakType}: ${streak} scommesse`,
      description: streakType === 'vincente' 
        ? 'Ottimo momento! Continua così ma mantieni la disciplina.'
        : 'Periodo difficile. Considera di rivedere la strategia.'
    });
  }

  // Bankroll check
  const totalStake = archivedBets.reduce((sum, b) => sum + b.stake, 0);
  const totalProfitto = archivedBets.reduce((sum, b) => sum + (b.risultato || 0), 0);
  const bankrollChange = (totalProfitto / totalStake) * 100;

  if (bankrollChange < -10) {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle className="h-4 w-4" />,
      title: 'Alert: Bankroll in calo',
      description: `Il tuo bankroll è in calo del ${Math.abs(bankrollChange).toFixed(1)}%. Considera di ridurre gli stake.`
    });
  } else if (bankrollChange > 20) {
    insights.push({
      type: 'success',
      icon: <TrendingUp className="h-4 w-4" />,
      title: 'Bankroll in crescita!',
      description: `Ottimo lavoro! Il bankroll è cresciuto del ${bankrollChange.toFixed(1)}% quest'anno.`
    });
  }

  return insights;
}

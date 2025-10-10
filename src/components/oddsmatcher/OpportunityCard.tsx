import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Opportunity } from '@/types/oddsmatcher';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSendToTracker: (opportunity: Opportunity) => void;
  onShowDetails: (opportunity: Opportunity) => void;
}

export function OpportunityCard({
  opportunity,
  onSendToTracker,
  onShowDetails,
}: OpportunityCardProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 90) return 'bg-green-500 text-white';
    if (rating >= 80) return 'bg-yellow-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const sportEmoji = opportunity.sport === 'soccer' ? '⚽' : opportunity.sport === 'tennis' ? '🎾' : '🏀';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold">
              {sportEmoji} {opportunity.eventName}
            </h3>
            <div className="text-sm text-muted-foreground">
              {opportunity.competition} • {format(new Date(opportunity.eventDate), 'dd/MM HH:mm', { locale: it })}
            </div>
          </div>
          <Badge className={getRatingColor(opportunity.rating)}>
            {opportunity.rating.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Mercato: {opportunity.market}
          </div>
          <div className="text-sm font-medium">
            Selezione: {opportunity.selection}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Badge variant="secondary" className="bg-blue-100 text-blue-900 mb-1">
              📗 {opportunity.bookmaker}
            </Badge>
            <div className="text-lg font-bold">{opportunity.quotaPunta.toFixed(2)}</div>
          </div>

          <div className="space-y-1">
            <Badge variant="secondary" className="bg-orange-100 text-orange-900 mb-1">
              📙 {opportunity.exchange}
            </Badge>
            <div className="text-lg font-bold">{opportunity.quotaBanca.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              Commissione: {opportunity.commission}%
            </div>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Profitto stimato:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(opportunity.profitEstimate)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Su stake di {formatCurrency(opportunity.suggestedStake)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2 pt-3">
        <Button
          onClick={() => onSendToTracker(opportunity)}
          className="flex-1"
        >
          <Send className="mr-2 h-4 w-4" />
          Invia a Tracker
        </Button>
        <Button
          variant="outline"
          onClick={() => onShowDetails(opportunity)}
        >
          <Info className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

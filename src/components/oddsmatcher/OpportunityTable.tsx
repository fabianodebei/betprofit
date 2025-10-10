import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Opportunity } from '@/types/oddsmatcher';

interface OpportunityTableProps {
  opportunities: Opportunity[];
  onSendToTracker: (opportunity: Opportunity) => void;
  onShowDetails: (opportunity: Opportunity) => void;
}

export function OpportunityTable({
  opportunities,
  onSendToTracker,
  onShowDetails,
}: OpportunityTableProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 90) return 'bg-green-500 text-white';
    if (rating >= 80) return 'bg-yellow-500 text-white';
    return 'bg-blue-500 text-white';
  };

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nessuna opportunità trovata. Prova a modificare i filtri.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evento</TableHead>
            <TableHead>Data/Ora</TableHead>
            <TableHead>Competizione</TableHead>
            <TableHead>Mercato</TableHead>
            <TableHead>Selezione</TableHead>
            <TableHead>Bookmaker</TableHead>
            <TableHead>Exchange</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Profitto</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => (
            <TableRow key={opp.id}>
              <TableCell className="font-medium">{opp.eventName}</TableCell>
              <TableCell>
                {format(new Date(opp.eventDate), 'dd/MM HH:mm', { locale: it })}
              </TableCell>
              <TableCell>{opp.competition}</TableCell>
              <TableCell>{opp.market}</TableCell>
              <TableCell>{opp.selection}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                    {opp.bookmaker}
                  </Badge>
                  <div className="text-sm font-semibold">{opp.quotaPunta.toFixed(2)}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-900">
                    {opp.exchange}
                  </Badge>
                  <div className="text-sm font-semibold">{opp.quotaBanca.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    Comm. {opp.commission}%
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getRatingColor(opp.rating)}>
                  {opp.rating.toFixed(1)}%
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-green-600">
                  {formatCurrency(opp.profitEstimate)}
                </div>
                <div className="text-xs text-muted-foreground">
                  su {formatCurrency(opp.suggestedStake)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => onSendToTracker(opp)}
                    className="flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    Invia
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onShowDetails(opp)}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

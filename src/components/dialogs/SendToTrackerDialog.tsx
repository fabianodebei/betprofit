import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useBets } from '@/contexts/BetContext';
import { useLayBets } from '@/contexts/LayBetContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';
import { calculateOptimalLayStake, calculateGuaranteedProfit, calculateLiability } from '@/utils/oddsCalculations';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Opportunity } from '@/types/oddsmatcher';

interface SendToTrackerDialogProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendToTrackerDialog({
  opportunity,
  open,
  onOpenChange,
}: SendToTrackerDialogProps) {
  const [stake, setStake] = useState<string>('100');
  const [includeLay, setIncludeLay] = useState(true);
  const [commission, setCommission] = useState<string>('4.5');
  const [loading, setLoading] = useState(false);

  const { addBet } = useBets();
  const { addLayBet } = useLayBets();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (opportunity) {
      setStake(opportunity.suggestedStake.toString());
      setCommission(opportunity.commission.toString());
      setIncludeLay(true);
    }
  }, [opportunity]);

  if (!opportunity) return null;

  const stakeNum = parseFloat(stake) || 0;
  const commissionNum = parseFloat(commission) || 0;

  const optimalLayStake = includeLay
    ? calculateOptimalLayStake(stakeNum, opportunity.quotaPunta, opportunity.quotaBanca, commissionNum)
    : 0;

  const liability = includeLay
    ? calculateLiability(optimalLayStake, opportunity.quotaBanca)
    : 0;

  const profit = includeLay
    ? calculateGuaranteedProfit(stakeNum, opportunity.quotaPunta, opportunity.quotaBanca, commissionNum)
    : { winProfit: stakeNum * (opportunity.quotaPunta - 1), loseProfit: -stakeNum, guaranteed: 0 };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create bookmaker bet
      const newBet = await addBet({
        tipo: 'Singola',
        metodo: opportunity.bookmaker,
        conto: opportunity.bookmaker,
        evento: opportunity.eventName,
        mercato: opportunity.market,
        competizione: opportunity.competition,
        dataEvento: opportunity.eventDate,
        quota: opportunity.quotaPunta,
        stake: stakeNum,
        stato: 'In Corso',
        vincitaPotenziale: stakeNum * opportunity.quotaPunta,
        risultato: null,
      });

      // Create lay bet if selected
      if (includeLay && newBet?.id) {
        await addLayBet({
          parentBetId: newBet.id,
          metodo: 'Banca' as const,
          conto: opportunity.exchange,
          evento: opportunity.eventName,
          mercato: opportunity.market,
          data_evento: opportunity.eventDate,
          quota_punta: opportunity.quotaPunta,
          quota_banca: opportunity.quotaBanca,
          stake: stakeNum,
          tasse_percentuale: commissionNum,
          url_evento: '',
        });
      }

      toast({
        title: 'Opportunità inviata',
        description: 'La giocata è stata aggiunta al Profit Tracker.',
      });

      onOpenChange(false);
      navigate('/giocate-in-corso');
    } catch (error) {
      console.error('Error sending to tracker:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile inviare la giocata al tracker.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invia a Giocate in Corso</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Info */}
          <div className="space-y-2 bg-muted p-4 rounded-lg">
            <div className="font-semibold text-lg">{opportunity.eventName}</div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{opportunity.competition}</span>
              <span>•</span>
              <span>{opportunity.market}</span>
              <span>•</span>
              <span>{format(new Date(opportunity.eventDate), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
            </div>
            <div className="text-sm font-medium">
              Selezione: {opportunity.selection}
            </div>
          </div>

          <Separator />

          {/* Bookmaker Bet */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Puntata Bookmaker</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bookmaker</Label>
                <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-900">
                  {opportunity.bookmaker}
                </Badge>
              </div>
              <div>
                <Label>Quota</Label>
                <div className="text-xl font-bold mt-1">{opportunity.quotaPunta.toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stake">Stake (€)</Label>
              <div className="flex gap-2">
                <Input
                  id="stake"
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  step="10"
                  min="1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const optimal = calculateOptimalLayStake(
                      100,
                      opportunity.quotaPunta,
                      opportunity.quotaBanca,
                      commissionNum
                    );
                    setStake('100');
                  }}
                >
                  Ottimale
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Vincita potenziale: {formatCurrency(stakeNum * opportunity.quotaPunta)}
            </div>
          </div>

          <Separator />

          {/* Include Lay Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-lay"
              checked={includeLay}
              onCheckedChange={(checked) => setIncludeLay(checked as boolean)}
            />
            <label
              htmlFor="include-lay"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Aggiungi bancata Exchange
            </label>
          </div>

          {/* Lay Bet Details */}
          {includeLay && (
            <div className="space-y-3 bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Bancata Exchange</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Exchange</Label>
                  <Badge variant="secondary" className="mt-1 bg-orange-100 text-orange-900">
                    {opportunity.exchange}
                  </Badge>
                </div>
                <div>
                  <Label>Quota Banca</Label>
                  <div className="text-xl font-bold mt-1">{opportunity.quotaBanca.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Commissione (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  step="0.1"
                  min="0"
                />
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stake bancata:</span>
                  <span className="font-semibold">{formatCurrency(optimalLayStake)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responsabilità:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(liability)}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Results Summary */}
          <div className="space-y-3 bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">Risultato</h3>
            <div className="space-y-2">
              {includeLay ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profitto se vince puntata:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(profit.winProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profitto se vince bancata:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(profit.loseProfit)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Profitto garantito:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(profit.guaranteed)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Rating:</span>
                    <Badge className="bg-blue-500 text-white">
                      {opportunity.rating.toFixed(1)}%
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Senza bancata, questa è una semplice giocata sportiva.
                  <div className="mt-2">
                    Vincita potenziale: {formatCurrency(profit.winProfit)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={loading || stakeNum <= 0}>
            {loading ? 'Invio...' : 'Invia a Profit Tracker'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

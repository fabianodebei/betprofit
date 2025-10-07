import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bet } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface ArchiveBetDialogProps {
  bet: Bet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (risultato: number) => void;
}

export function ArchiveBetDialog({ bet, open, onOpenChange, onConfirm }: ArchiveBetDialogProps) {
  const [outcome, setOutcome] = useState<'win' | 'loss' | 'refund'>('win');

  if (!bet) return null;

  const calculateRisultato = () => {
    if (outcome === 'win') {
      const quota = bet.quota || 1;
      return (bet.stake * quota) - bet.stake;
    }
    if (outcome === 'loss') {
      return -bet.stake;
    }
    return 0; // refund
  };

  const risultato = calculateRisultato();

  const handleConfirm = () => {
    onConfirm(risultato);
    onOpenChange(false);
    setOutcome('win');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archivia Puntata</DialogTitle>
          <DialogDescription>
            Seleziona l'esito della puntata per archiviarla
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Evento: <span className="text-muted-foreground">{bet.evento || bet.nomeGioco || 'N/A'}</span>
            </p>
            <p className="text-sm font-medium">
              Stake: <span className="text-muted-foreground">{formatCurrency(bet.stake)}</span>
            </p>
            <p className="text-sm font-medium">
              Quota: <span className="text-muted-foreground">{bet.quota || 'N/A'}</span>
            </p>
          </div>

          <RadioGroup value={outcome} onValueChange={(value) => setOutcome(value as 'win' | 'loss' | 'refund')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="win" id="win" />
              <Label htmlFor="win">Vinta</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="loss" id="loss" />
              <Label htmlFor="loss">Persa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="refund" id="refund" />
              <Label htmlFor="refund">Rimborsata</Label>
            </div>
          </RadioGroup>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Risultato calcolato:</p>
            <p className={`text-2xl font-bold ${risultato > 0 ? 'text-success' : risultato < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {formatCurrency(risultato)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleConfirm}>
            Conferma Archiviazione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

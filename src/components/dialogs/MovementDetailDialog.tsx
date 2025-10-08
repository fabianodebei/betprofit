import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/dates';
import { Bet, Transaction } from '@/types';

interface MovementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: {
    data: Bet | Transaction;
    type: 'bet' | 'transaction';
  } | null;
}

export function MovementDetailDialog({ open, onOpenChange, movement }: MovementDetailDialogProps) {
  if (!movement) return null;

  const renderBetDetails = (bet: Bet) => {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">{bet.evento || 'Dettaglio Scommessa'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">ID</div>
              <div className="text-sm font-medium">{bet.id.substring(0, 8)}</div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Tipo Evento</div>
              <div className="text-sm font-medium">{bet.tipo}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Metodo</div>
              <div className="text-sm font-medium">{bet.metodo || 'Punta'}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Stato</div>
              <div className="text-sm font-medium">
                {bet.stato === 'In Corso' ? 'Aperta' : 'Archiviata'}
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Data Evento</div>
              <div className="text-sm font-medium">{formatDateTime(bet.dataEvento)}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Evento</div>
              <div className="text-sm font-medium">{bet.evento || '-'}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Intestatario</div>
              <div className="text-sm font-medium">{bet.conto.split(' ')[0]}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Conto</div>
              <div className="text-sm font-medium">{bet.conto}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Mercato</div>
              <div className="text-sm font-medium">{bet.mercato || '-'}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Stato Evento</div>
              <div className="text-sm font-medium">
                {bet.stato === 'In Corso' ? 'In Corso' : 'Concluso'}
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Movimento</div>
              <div className="text-sm font-semibold text-destructive">
                {formatCurrency(-bet.stake)}
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Quota Banca</div>
              <div className="text-sm font-medium">{bet.quota?.toFixed(3) || '0.000'}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Quota Punta</div>
              <div className="text-sm font-medium">{bet.quotaPunta?.toFixed(3) || '0.000'}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Stake</div>
              <div className="text-sm font-medium">{formatCurrency(bet.stake)}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Bonus</div>
              <div className="text-sm font-medium">{formatCurrency(bet.bonus || 0)}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Tipo Bonus</div>
              <div className="text-sm font-medium">{bet.tipoBonus || 'Nessuno'}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Tasse</div>
              <div className="text-sm font-medium">{formatCurrency(0)}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Creato</div>
              <div className="text-sm font-medium">{formatDateTime(bet.createdAt)}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Modificato</div>
              <div className="text-sm font-medium">{formatDateTime(bet.createdAt)}</div>
            </div>

            {bet.note && (
              <div className="bg-muted/30 p-3 rounded col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Note</div>
                <div className="text-sm font-medium">{bet.note}</div>
              </div>
            )}

            {bet.tag && (
              <div className="bg-muted/30 p-3 rounded col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Tag</div>
                <div className="text-sm font-medium">{bet.tag}</div>
              </div>
            )}

            {bet.competizione && (
              <div className="bg-muted/30 p-3 rounded col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Competizione</div>
                <div className="text-sm font-medium">{bet.competizione}</div>
              </div>
            )}

            {bet.risultato !== undefined && (
              <div className="bg-muted/30 p-3 rounded col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Risultato</div>
                <div className="text-sm font-semibold text-success">
                  {formatCurrency(bet.risultato)}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderTransactionDetails = (transaction: Transaction) => {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">Dettaglio Transazione</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">ID</div>
              <div className="text-sm font-medium">{transaction.id.substring(0, 8)}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Metodo</div>
              <div className="text-sm font-medium">{transaction.metodo}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Data Registrazione</div>
              <div className="text-sm font-medium">{formatDateTime(transaction.registrato)}</div>
            </div>

            <div className="bg-muted/30 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Conto</div>
              <div className="text-sm font-medium">{transaction.conto}</div>
            </div>

            {transaction.intestatario && (
              <div className="bg-muted/30 p-3 rounded">
                <div className="text-xs text-muted-foreground mb-1">Intestatario</div>
                <div className="text-sm font-medium">{transaction.intestatario}</div>
              </div>
            )}

            {transaction.wallet && (
              <div className="bg-muted/30 p-3 rounded">
                <div className="text-xs text-muted-foreground mb-1">Wallet</div>
                <div className="text-sm font-medium">{transaction.wallet}</div>
              </div>
            )}

            {transaction.addebito && (
              <div className="bg-muted/30 p-3 rounded">
                <div className="text-xs text-muted-foreground mb-1">Addebito</div>
                <div className="text-sm font-semibold text-success">
                  {formatCurrency(transaction.addebito)}
                </div>
              </div>
            )}

            {transaction.accredito && (
              <div className="bg-muted/30 p-3 rounded">
                <div className="text-xs text-muted-foreground mb-1">Accredito</div>
                <div className="text-sm font-semibold text-destructive">
                  {formatCurrency(transaction.accredito)}
                </div>
              </div>
            )}

            {transaction.descrizione && (
              <div className="bg-muted/30 p-3 rounded col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Descrizione</div>
                <div className="text-sm font-medium">{transaction.descrizione}</div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {movement.type === 'bet' 
          ? renderBetDetails(movement.data as Bet)
          : renderTransactionDetails(movement.data as Transaction)
        }
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

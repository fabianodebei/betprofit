import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy } from 'lucide-react';
import { Bet } from '@/types';
import { useLayBets } from '@/contexts/LayBetContext';
import { useBetLegs } from '@/contexts/BetLegContext';
import { LayBetForm } from '@/components/forms/LayBetForm';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { getMultiplaCalculations } from '@/utils/multiplaCalculations';

interface MultiplaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bet: Bet | null;
}

export function MultiplaDetailDialog({ open, onOpenChange, bet }: MultiplaDetailDialogProps) {
  const { getLayBetsByParentId, deleteLayBet } = useLayBets();
  const { getBetLegsByBetId } = useBetLegs();
  const [showLayBetForm, setShowLayBetForm] = useState(false);
  const [editingLayBet, setEditingLayBet] = useState<any>(null);

  const layBets = bet 
    ? getLayBetsByParentId(bet.id).sort((a, b) => 
        new Date(a.dataEvento).getTime() - new Date(b.dataEvento).getTime()
      )
    : [];
  const betLegs = bet ? getBetLegsByBetId(bet.id) : [];

  // Usa la funzione centralizzata per i calcoli
  const calculations = useMemo(
    () => getMultiplaCalculations(bet, layBets, betLegs),
    [bet, layBets, betLegs]
  );

  if (!bet) return null;

  const handleEditLayBet = (layBet: any) => {
    setEditingLayBet(layBet);
    setShowLayBetForm(true);
  };

  const handleDeleteLayBet = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa bancata?')) {
      await deleteLayBet(id);
    }
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Dettaglio Puntata
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingLayBet(null);
                  setShowLayBetForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova Bancata
              </Button>
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Evento</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Competizione</TableHead>
                      <TableHead>Mercato</TableHead>
                      <TableHead>Metodo</TableHead>
                      <TableHead>Tipo Bonus</TableHead>
                      <TableHead>Conto</TableHead>
                      <TableHead>Stake</TableHead>
                      <TableHead>Quota Punta</TableHead>
                      <TableHead>Quota Banca</TableHead>
                      <TableHead>Rischio</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Rimborso</TableHead>
                      <TableHead>Tasse</TableHead>
                      <TableHead>Mov.</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Opzioni</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {/* Main Multipla Bet Row */}
                  <TableRow className="bg-primary/5 border-l-4 border-l-primary">
                    <TableCell>
                        {format(new Date(bet.dataEvento), 'dd MMMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Copy className="h-4 w-4" />
                          {bet.evento || `MULTIPLA ${betLegs.length > 0 ? betLegs[0].competizione : ''}`}
                        </div>
                      </TableCell>
                      <TableCell>{betLegs.length > 0 ? betLegs[0].competizione : '-'}</TableCell>
                      <TableCell>Multipla</TableCell>
                      <TableCell>
                        <Badge>Punta</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{bet.tipoBonus || 'Nessuno'}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{bet.conto}</TableCell>
                      <TableCell className="font-semibold text-primary">{formatCurrency(bet.stake)}</TableCell>
                      <TableCell className="font-semibold">{bet.quotaCombinata?.toFixed(3) || bet.quota?.toFixed(3)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(0)}</TableCell>
                      <TableCell>{formatCurrency(bet.bonus || 0)}</TableCell>
                      <TableCell>{formatCurrency(bet.rimborso || 0)}</TableCell>
                      <TableCell>0,00</TableCell>
                      <TableCell>{formatCurrency(0)}</TableCell>
                      <TableCell className="text-primary text-sm">{bet.tag || '(non impostato)'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          Clona
                        </Button>
                      </TableCell>
                  </TableRow>

                  {/* Lay Bets Rows */}
                  {layBets.map((layBet) => {
                    const rischio = layBet.stake * (layBet.quotaBanca - 1);
                    const tasse = layBet.stake * (layBet.quotaBanca - 1) * (layBet.tassePercentuale / 100);
                    
                    return (
                      <TableRow key={layBet.id} className="bg-accent/5 border-l-4 border-l-accent">
                        <TableCell>
                          {format(new Date(layBet.dataEvento), 'dd MMMM yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{layBet.evento}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{layBet.mercato}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Banca</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {layBet.metodo === 'Banca' ? '📝' : '✓'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{layBet.conto}</TableCell>
                        <TableCell className="font-semibold text-accent">{formatCurrency(layBet.stake)}</TableCell>
                        <TableCell className="font-semibold">{layBet.quotaPunta.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-red-600">{layBet.quotaBanca.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600 font-semibold">{formatCurrency(rischio)}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                         <TableCell>{formatCurrency(0)}</TableCell>
                         <TableCell className="text-accent">{formatCurrency(tasse)}</TableCell>
                         <TableCell>{formatCurrency(0)}</TableCell>
                         <TableCell className="text-sm">-</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditLayBet(layBet)}
                            >
                              Clona
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditLayBet(layBet)}
                            >
                              Punta
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteLayBet(layBet.id)}
                            >
                              Elimina
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="flex justify-center px-4 py-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Totale Rischio</div>
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(calculations.totalRisk)}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lay Bet Form Dialog */}
      {showLayBetForm && (
        <LayBetForm
          open={showLayBetForm}
          onOpenChange={setShowLayBetForm}
          parentBet={bet}
          parentBetId={bet.id}
          editingLayBet={editingLayBet}
          betLegs={betLegs}
        />
      )}
    </>
  );
}

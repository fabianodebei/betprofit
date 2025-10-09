import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Copy } from 'lucide-react';
import { Bet } from '@/types';
import { useLayBets } from '@/contexts/LayBetContext';
import { useBetLegs } from '@/contexts/BetLegContext';
import { LayBetForm } from '@/components/forms/LayBetForm';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';

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

  const layBets = bet ? getLayBetsByParentId(bet.id) : [];
  const betLegs = bet ? getBetLegsByBetId(bet.id) : [];

  // Calculate totals
  const calculations = useMemo(() => {
    if (!bet) return { totalRisk: 0, guadagnoTotale: 0 };

    const totalRisk = bet.stake + layBets.reduce((sum, lb) => sum + lb.stake, 0);
    
    // Guadagno totale calculation
    const guadagnoTotale = layBets.reduce((sum, lb) => {
      // For each lay bet, calculate the difference
      const rischio = lb.stake * (lb.quotaBanca - 1) * (1 + lb.tassePercentuale / 100);
      return sum + rischio;
    }, 0);

    return {
      totalRisk,
      guadagnoTotale: -guadagnoTotale,
    };
  }, [bet, layBets]);

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
            <DialogTitle>Dettaglio Puntata #{bet.id.substring(0, 7)}</DialogTitle>
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
                    <TableHead>Stato Evento</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Opzioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Main Multipla Bet Row */}
                  <TableRow className="bg-blue-50 dark:bg-blue-950">
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
                    <TableCell className="font-semibold text-blue-600">{formatCurrency(bet.stake)}</TableCell>
                    <TableCell className="font-semibold">{bet.quotaCombinata?.toFixed(3) || bet.quota?.toFixed(3)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(0)}</TableCell>
                    <TableCell>{formatCurrency(bet.bonus || 0)}</TableCell>
                    <TableCell>{formatCurrency(bet.rimborso || 0)}</TableCell>
                    <TableCell>0,00</TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                    <TableCell>
                      <Badge variant={bet.stato === 'In Corso' ? 'default' : 'secondary'}>
                        {bet.stato}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-blue-600 text-sm">{bet.tag || '(non impostato)'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">
                        Clona
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Lay Bets Rows */}
                  {layBets.map((layBet) => {
                    const rischio = layBet.stake * (layBet.quotaBanca - 1) * (1 + layBet.tassePercentuale / 100);
                    const tasse = layBet.stake * (layBet.quotaBanca - 1) * (layBet.tassePercentuale / 100);
                    
                    return (
                      <TableRow key={layBet.id} className="bg-orange-50 dark:bg-orange-950">
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
                        <TableCell className="font-semibold text-orange-600">{formatCurrency(layBet.stake)}</TableCell>
                        <TableCell className="font-semibold">{layBet.quotaPunta.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-red-600">{layBet.quotaBanca.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600 font-semibold">{formatCurrency(rischio)}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell className="text-orange-600">{formatCurrency(tasse)}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell>
                          <Badge>Bozza</Badge>
                        </TableCell>
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

            {/* Totals */}
            <div className="flex justify-end gap-8 px-4 py-2 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Totale Rischio: </span>
                <span className="font-bold text-red-600">{formatCurrency(calculations.totalRisk)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Guadagno Totale: </span>
                <span className={`font-bold ${calculations.guadagnoTotale >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(calculations.guadagnoTotale)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LayBetForm
        open={showLayBetForm}
        onOpenChange={(open) => {
          setShowLayBetForm(open);
          if (!open) setEditingLayBet(null);
        }}
        parentBetId={bet.id}
        editingLayBet={editingLayBet}
        mode={editingLayBet ? 'edit' : 'create'}
      />
    </>
  );
}

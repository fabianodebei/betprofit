import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Bet } from '@/types';
import { useLayBets } from '@/contexts/LayBetContext';
import { useBets } from '@/contexts/BetContext';
import { LayBetForm } from '@/components/forms/LayBetForm';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SingleBetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bet: Bet | null;
}

export function SingleBetDetailDialog({ open, onOpenChange, bet }: SingleBetDetailDialogProps) {
  const { getLayBetsByParentId, deleteLayBet } = useLayBets();
  const { updateBet } = useBets();
  const [showLayBetForm, setShowLayBetForm] = useState(false);
  const [editingLayBet, setEditingLayBet] = useState<any>(null);

  const layBets = bet ? getLayBetsByParentId(bet.id) : [];

  // Calculate totals
  const calculations = useMemo(() => {
    if (!bet) return { totalRisk: 0, guadagnoTotale: 0, scenarioVincita: 0, scenarioPerdita: 0 };

    // Calcolo vincita/perdita puntata principale
    let puntaWin: number, puntaLoss: number;
    
    if (bet.tipoBonus === 'Free Bet') {
      // Free Bet: vincita = stake * (quota - 1), perdita = 0
      puntaWin = bet.stake * ((bet.quota || 1) - 1);
      puntaLoss = 0;
    } else if (bet.tipoBonus === 'Bonus' && bet.bonus) {
      // Bonus: vincita = (stake + bonus) * quota, perdita = -stake
      puntaWin = (bet.stake + bet.bonus) * (bet.quota || 1);
      puntaLoss = -bet.stake;
    } else {
      // Normale: solo profitto netto, perdita = -stake
      puntaWin = bet.stake * (bet.quota || 1) - bet.stake;
      puntaLoss = -bet.stake;
    }

    // Calcolo vincite/perdite dalle bancate
    const layWins = layBets.reduce((sum, lb) => {
      // Vincita netta della bancata (stake - tasse)
      const profitLordo = lb.stake;
      const tasse = profitLordo * ((lb.tassePercentuale || 0) / 100);
      return sum + (profitLordo - tasse);
    }, 0);

    const layLosses = layBets.reduce((sum, lb) => {
      // Perdita della bancata
      return sum + lb.stake * (lb.quotaBanca - 1);
    }, 0);

    // Scenario 1: Puntata vince, bancate perdono
    const scenarioVincita = puntaWin - layLosses;
    
    // Scenario 2: Puntata perde, bancate vincono
    const scenarioPerdita = puntaLoss + layWins;

    // Guadagno garantito = scenario peggiore
    const guadagnoTotale = Math.min(scenarioVincita, scenarioPerdita);

    const totalRisk = bet.stake + layBets.reduce((sum, lb) => sum + lb.stake, 0);

    return {
      totalRisk,
      guadagnoTotale,
      scenarioVincita,
      scenarioPerdita,
    };
  }, [bet, layBets]);

  if (!bet) return null;

  const handleEditLayBet = (layBet: any) => {
    setEditingLayBet(layBet);
    setShowLayBetForm(true);
  };

  const handleDeleteLayBet = async (layBet: any) => {
    if (layBet.stato !== 'Bozza') {
      toast.error('Puoi eliminare solo bancate in stato Bozza');
      return;
    }
    if (confirm('Sei sicuro di voler eliminare questa bancata?')) {
      await deleteLayBet(layBet.id);
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
                    <TableHead>Tag</TableHead>
                    <TableHead>Opzioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Main Bet Row */}
                  <TableRow className="bg-primary/5 border-l-4 border-l-primary">
                    <TableCell>
                      {format(new Date(bet.dataEvento), 'dd MMMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {bet.evento || '-'}
                    </TableCell>
                    <TableCell>{bet.competizione || '-'}</TableCell>
                    <TableCell>{bet.mercato || '-'}</TableCell>
                    <TableCell>
                      <Badge>{bet.metodo || 'Punta'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{bet.tipoBonus || 'Nessuno'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{bet.conto}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatCurrency(bet.stake)}</TableCell>
                    <TableCell className="font-semibold">{bet.quota?.toFixed(2)}</TableCell>
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
                    const rischio = layBet.stake * (layBet.quotaBanca - 1) * (1 + layBet.tassePercentuale / 100);
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
                              variant="outline"
                              onClick={() => handleEditLayBet(layBet)}
                            >
                              Modifica
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteLayBet(layBet)}
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
            <div className="flex justify-end gap-8 px-4 py-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Totale Rischio</div>
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(calculations.totalRisk)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Se Puntata Vince</div>
                <div className={`text-lg font-bold ${calculations.scenarioVincita >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(calculations.scenarioVincita)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Se Puntata Perde</div>
                <div className={`text-lg font-bold ${calculations.scenarioPerdita >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(calculations.scenarioPerdita)}
                </div>
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
        parentBetId={bet?.id}
        editingLayBet={editingLayBet}
        mode={editingLayBet ? 'edit' : 'create'}
        parentBet={bet}
      />
    </>
  );
}

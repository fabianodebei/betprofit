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
  
  const isEditable = bet?.statoEvento === 'Bozza';

  // Calculate totals
  const calculations = useMemo(() => {
    if (!bet) return { totalRisk: 0, guadagnoTotale: 0 };

    const totalRisk = bet.stake + layBets.reduce((sum, lb) => sum + lb.stake, 0);
    
    // Guadagno totale calculation
    const guadagnoTotale = layBets.reduce((sum, lb) => {
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

  const handleStatoEventoChange = async (newStato: 'Bozza' | 'In Corso' | 'Vinta' | 'Persa' | 'Annullata') => {
    if (!bet) return;
    
    try {
      await updateBet(bet.id, { statoEvento: newStato });
      toast.success('Stato evento aggiornato');
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento dello stato');
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
            <div className="flex gap-2 justify-between items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingLayBet(null);
                  setShowLayBetForm(true);
                }}
                disabled={!isEditable}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova Bancata
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Stato Evento:</span>
                <Select
                  value={bet.statoEvento || 'Bozza'}
                  onValueChange={handleStatoEventoChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bozza">Bozza</SelectItem>
                    <SelectItem value="In Corso">In Corso</SelectItem>
                    <SelectItem value="Vinta">Vinta</SelectItem>
                    <SelectItem value="Persa">Persa</SelectItem>
                    <SelectItem value="Annullata">Annullata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <TableCell>
                      <Badge variant={
                        bet.statoEvento === 'Bozza' ? 'outline' :
                        bet.statoEvento === 'In Corso' ? 'default' :
                        bet.statoEvento === 'Vinta' ? 'default' :
                        bet.statoEvento === 'Persa' ? 'destructive' :
                        'secondary'
                      }>
                        {bet.statoEvento || 'Bozza'}
                      </Badge>
                    </TableCell>
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
        parentBet={bet}
      />
    </>
  );
}

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Copy } from 'lucide-react';
import { Bet, LayBet } from '@/types';
import { useLayBets } from '@/contexts/LayBetContext';
import { useBetLegs } from '@/contexts/BetLegContext';
import { useBets } from '@/contexts/BetContext';
import { LayBetForm } from '@/components/forms/LayBetForm';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { getMultiplaCalculations } from '@/utils/multiplaCalculations';
import { toast } from 'sonner';

interface MultiplaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bet: Bet | null;
}

export function MultiplaDetailDialog({ open, onOpenChange, bet }: MultiplaDetailDialogProps) {
  const { getLayBetsByParentId, deleteLayBet, updateLayBet } = useLayBets();
  const { getBetLegsByBetId } = useBetLegs();
  const { archiveBet, updateBet } = useBets();
  const [showLayBetForm, setShowLayBetForm] = useState(false);
  const [editingLayBet, setEditingLayBet] = useState<any>(null);

  const layBets = bet ? getLayBetsByParentId(bet.id) : [];
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

  const handleArchiviaFromLayBet = async (layBet: LayBet) => {
    if (!bet) return;
    
    // Calcola automaticamente il risultato in base allo stato della bancata
    let risultato = 0;
    let esito: 'win' | 'loss' | 'refund' = 'loss';
    const esitoDettaglio = layBet.id;
    
    if (layBet.stato === 'Vinto') {
      // La bancata è vinta → la puntata è persa su questa gamba
      risultato = layBet.stake - (layBet.stake * (layBet.quotaBanca - 1));
      esito = 'loss';
    } else if (layBet.stato === 'Perso') {
      // La bancata è persa → la puntata potrebbe essere vinta
      risultato = -layBet.stake * (layBet.quotaBanca - 1);
      esito = 'win';
    } else if (layBet.stato === 'Annullato') {
      risultato = 0;
      esito = 'refund';
    }
    
    // Chiama la funzione di archiviazione del BetContext
    await archiveBet(bet.id, risultato, esito, esitoDettaglio);
    
    toast.success('Scommessa archiviata automaticamente');
    onOpenChange(false);
  };

  const handleArchiviaFromMultipla = async () => {
    if (!bet || !bet.statoEvento) return;
    
    // Calcola il risultato in base allo stato della multipla
    let risultato = 0;
    let esito: 'win' | 'loss' | 'refund' = 'loss';
    
    if (bet.statoEvento === 'Vinto') {
      // Multipla vinta: calcola la vincita
      const quotaEffettiva = bet.quotaCombinata || bet.quota || 1;
      if (bet.tipoBonus === 'Free Bet') {
        risultato = bet.stake * (quotaEffettiva - 1);
      } else if (bet.tipoBonus === 'Bonus' && bet.bonus) {
        risultato = (bet.stake + bet.bonus) * quotaEffettiva - bet.stake;
      } else {
        risultato = bet.stake * quotaEffettiva - bet.stake;
      }
      
      // Sottrai le liability delle bancate
      layBets.forEach(lb => {
        if (lb.stato === 'In Corso') {
          risultato -= lb.stake * (lb.quotaBanca - 1);
        }
      });
      
      esito = 'win';
    } else if (bet.statoEvento === 'Perso') {
      // Multipla persa
      if (bet.tipoBonus === 'Free Bet') {
        risultato = 0;
      } else {
        risultato = -(bet.stake - (bet.rimborso || 0));
      }
      
      // Aggiungi le vincite delle bancate se presenti
      layBets.forEach(lb => {
        if (lb.stato === 'In Corso') {
          const profittoLordo = lb.stake;
          const tasse = profittoLordo * (lb.tassePercentuale / 100);
          risultato += profittoLordo - tasse;
        }
      });
      
      esito = 'loss';
    } else if (bet.statoEvento === 'Annullato') {
      risultato = 0;
      esito = 'refund';
    }
    
    await archiveBet(bet.id, risultato, esito);
    toast.success('Multipla archiviata automaticamente');
    onOpenChange(false);
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
                      <TableHead>Stato</TableHead>
                      <TableHead>Archivia</TableHead>
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
                        <Select
                          value={bet.statoEvento || 'Bozza'}
                          onValueChange={(value) => {
                            updateBet(bet.id, { statoEvento: value as Bet['statoEvento'] });
                          }}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bozza">Bozza</SelectItem>
                            <SelectItem value="In Corso">In Corso</SelectItem>
                            <SelectItem value="Vinto">Vinto</SelectItem>
                            <SelectItem value="Perso">Perso</SelectItem>
                            <SelectItem value="Annullato">Annullato</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {bet.statoEvento && ['Vinto', 'Perso', 'Annullato'].includes(bet.statoEvento) && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              if (confirm(`Sei sicuro di voler archiviare la multipla? Lo stato è "${bet.statoEvento}".`)) {
                                handleArchiviaFromMultipla();
                              }
                            }}
                          >
                            Archivia
                          </Button>
                        )}
                      </TableCell>
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
                           <Select
                             value={layBet.stato}
                             onValueChange={(value) => {
                               updateLayBet(layBet.id, { stato: value as LayBet['stato'] });
                             }}
                           >
                             <SelectTrigger className="w-[130px]">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="Bozza">Bozza</SelectItem>
                               <SelectItem value="In Corso">In Corso</SelectItem>
                               <SelectItem value="Vinto">Vinto</SelectItem>
                               <SelectItem value="Perso">Perso</SelectItem>
                               <SelectItem value="Annullato">Annullato</SelectItem>
                             </SelectContent>
                           </Select>
                         </TableCell>
                         <TableCell>
                           {['Vinto', 'Perso', 'Annullato'].includes(layBet.stato) && (
                             <Button
                               size="sm"
                               variant="default"
                               onClick={() => {
                                 if (confirm(`Sei sicuro di voler archiviare la multipla? Lo stato della bancata è "${layBet.stato}".`)) {
                                   handleArchiviaFromLayBet(layBet);
                                 }
                               }}
                             >
                               Archivia
                             </Button>
                           )}
                         </TableCell>
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
          parentBetId={bet?.id}
          editingLayBet={editingLayBet}
          betLegs={betLegs}
        />
      )}
    </>
  );
}

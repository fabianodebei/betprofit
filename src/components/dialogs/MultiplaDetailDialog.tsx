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
  const { archiveBet } = useBets();
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
                      <TableHead>GM</TableHead>
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
                          {betLegs.length > 0 
                            ? betLegs.map(leg => leg.evento).join(', ')
                            : bet.evento || 'MULTIPLA'}
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
                      <TableCell>-</TableCell>
                      <TableCell className="text-primary text-sm">{bet.tag || '(non impostato)'}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          Clona
                        </Button>
                      </TableCell>
                  </TableRow>

                  {/* Lay Bets Rows */}
                  {layBets.map((layBet) => {
                    const rischio = layBet.stake * (layBet.quotaBanca - 1);
                    // Tasse si pagano SOLO quando la bancata VINCE
                    const tassePerRischio = layBet.stato === 'Vinto' 
                      ? rischio * (layBet.tassePercentuale / 100)
                      : 0;
                    const tassePerStake = layBet.stato === 'Vinto'
                      ? layBet.stake * (layBet.tassePercentuale / 100)
                      : 0;
                    
                    // Calcolo GM in base allo stato della bancata
                    let gm = 0;
                    if (layBet.stato === 'Vinto') {
                      // Bancata vinta = ho vinto lo stake meno le tasse sullo stake
                      gm = layBet.stake - tassePerStake;
                    } else if (layBet.stato === 'Perso') {
                      // Bancata persa = ho perso SOLO il rischio (liability), SENZA tasse!
                      gm = -rischio;
                    } else if (layBet.stato === 'Annullato') {
                      gm = 0;
                    }
                    // Se è in Bozza o In Corso, GM = 0
                    
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
                          <TableCell className="text-accent">{formatCurrency(tassePerRischio)}</TableCell>
                         <TableCell>{formatCurrency(0)}</TableCell>
                         <TableCell className={`font-semibold ${gm > 0 ? 'text-green-600' : gm < 0 ? 'text-red-600' : ''}`}>
                           {formatCurrency(gm)}
                         </TableCell>
                         <TableCell className="text-sm">-</TableCell>
                         <TableCell>
                           {(() => {
                             // Trova l'indice corrente
                             const currentIndex = layBets.findIndex(lb => lb.id === layBet.id);
                             // Verifica se c'è una bancata vinta prima di questa
                             const hasPreviousWonBet = layBets.slice(0, currentIndex).some(lb => lb.stato === 'Vinto');
                             
                             // Se c'è una bancata vinta prima, questo deve essere in bozza e non modificabile
                             if (hasPreviousWonBet) {
                               return (
                                 <Select value="Bozza" disabled>
                                   <SelectTrigger className="w-[130px]">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="Bozza">Bozza</SelectItem>
                                   </SelectContent>
                                 </Select>
                               );
                             }
                             
                              // Altrimenti, normale select modificabile
                              return (
                                <Select
                                  value={layBet.stato}
                                  onValueChange={async (value) => {
                                    await updateLayBet(layBet.id, { stato: value as LayBet['stato'] });
                                    
                                    // Se è stata vinta, imposta le successive a Bozza e la precedente a Perso
                                    if (value === 'Vinto') {
                                      // Imposta la bancata precedente come Perso (la punta è arrivata lì)
                                      if (currentIndex > 0) {
                                        const previousBet = layBets[currentIndex - 1];
                                        await updateLayBet(previousBet.id, { stato: 'Perso' });
                                      }
                                      
                                      // Imposta le successive a Bozza (non giocate)
                                      const nextBets = layBets.slice(currentIndex + 1);
                                      for (const nextBet of nextBets) {
                                        await updateLayBet(nextBet.id, { stato: 'Bozza' });
                                      }
                                    }
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
                              );
                            })()}
                         </TableCell>
                         <TableCell>
                           {(() => {
                             // Se questa bancata è vinta, la multipla è chiusa
                             if (layBet.stato === 'Vinto') {
                               return (
                                 <Button
                                   size="sm"
                                   variant="default"
                                   onClick={() => {
                                     if (confirm(`La multipla è chiusa perché questa bancata è vinta. Vuoi archiviare?`)) {
                                       handleArchiviaFromLayBet(layBet);
                                     }
                                   }}
                                 >
                                   Archivia
                                 </Button>
                               );
                             }
                             
                             // Per altri stati finali, verifica che non ci siano bancate attive
                             if (['Perso', 'Annullato'].includes(layBet.stato)) {
                               const hasOtherActiveBets = layBets.some(
                                 lb => lb.stato === 'In Corso' || lb.stato === 'Bozza'
                               );
                               
                               const completedBets = layBets.filter(lb => 
                                 ['Vinto', 'Perso', 'Annullato'].includes(lb.stato)
                               );
                               const lastCompletedBet = completedBets.length > 0 
                                 ? completedBets[completedBets.length - 1] 
                                 : null;
                               
                               const isLastCompleted = lastCompletedBet?.id === layBet.id;
                               const canArchive = isLastCompleted && !hasOtherActiveBets;
                               
                               if (canArchive) {
                                 return (
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
                                 );
                               }
                             }
                             
                             return null;
                           })()}
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
                  
                  {/* Riga Totali */}
                  <TableRow className="bg-muted/50 border-t-2 border-primary">
                    <TableCell colSpan={9} className="text-right font-semibold">
                      Rischio:
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-bold text-lg text-red-600">
                      {formatCurrency(calculations.totalRisk)}
                    </TableCell>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="text-right font-semibold">Totale GM:</TableCell>
                    <TableCell className={`font-bold text-lg ${
                      (() => {
                        // Se TUTTE le bancate sono perse, la multipla è vinta
                        const tutteBancatePerso = layBets.length > 0 && layBets.every(lb => lb.stato === 'Perso');
                        
                        if (tutteBancatePerso) {
                          // Calcola vincita multipla
                          const quotaEffettiva = bet.quotaCombinata || bet.quota || 1;
                          let vincitaMultipla = 0;
                          if (bet.tipoBonus === 'Free Bet') {
                            vincitaMultipla = bet.stake * (quotaEffettiva - 1);
                          } else if (bet.tipoBonus === 'Bonus' && bet.bonus) {
                            vincitaMultipla = (bet.stake + bet.bonus) * quotaEffettiva - bet.stake;
                          } else {
                            vincitaMultipla = bet.stake * quotaEffettiva - bet.stake;
                          }
                          
                          // GM = vincita multipla - tutti i rischi
                          const sommaRischi = layBets.reduce((sum, lb) => sum + lb.stake * (lb.quotaBanca - 1), 0);
                          return vincitaMultipla - sommaRischi >= 0;
                        }
                        
                        // Altrimenti, calcolo normale
                        const gmTotale = layBets.reduce((sum, lb) => {
                          const rischio = lb.stake * (lb.quotaBanca - 1);
                          const tassePerStake = lb.stato === 'Vinto' 
                            ? lb.stake * (lb.tassePercentuale / 100)
                            : 0;
                          let gm = 0;
                          if (lb.stato === 'Vinto') gm = lb.stake - tassePerStake;
                          else if (lb.stato === 'Perso') gm = -rischio;
                          return sum + gm;
                        }, 0);
                        return gmTotale >= 0;
                      })() ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency((() => {
                        // Se TUTTE le bancate sono perse, la multipla è vinta
                        const tutteBancatePerso = layBets.length > 0 && layBets.every(lb => lb.stato === 'Perso');
                        
                        if (tutteBancatePerso) {
                          // Calcola vincita multipla
                          const quotaEffettiva = bet.quotaCombinata || bet.quota || 1;
                          let vincitaMultipla = 0;
                          if (bet.tipoBonus === 'Free Bet') {
                            vincitaMultipla = bet.stake * (quotaEffettiva - 1);
                          } else if (bet.tipoBonus === 'Bonus' && bet.bonus) {
                            vincitaMultipla = (bet.stake + bet.bonus) * quotaEffettiva - bet.stake;
                          } else {
                            vincitaMultipla = bet.stake * quotaEffettiva - bet.stake;
                          }
                          
                          // GM = vincita multipla - tutti i rischi
                          const sommaRischi = layBets.reduce((sum, lb) => sum + lb.stake * (lb.quotaBanca - 1), 0);
                          return vincitaMultipla - sommaRischi;
                        }
                        
                        // Altrimenti, calcolo normale
                        return layBets.reduce((sum, lb) => {
                          const rischio = lb.stake * (lb.quotaBanca - 1);
                          const tassePerStake = lb.stato === 'Vinto'
                            ? lb.stake * (lb.tassePercentuale / 100)
                            : 0;
                          let gm = 0;
                          if (lb.stato === 'Vinto') gm = lb.stake - tassePerStake;
                          else if (lb.stato === 'Perso') gm = -rischio;
                          return sum + gm;
                        }, 0);
                      })())}
                    </TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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

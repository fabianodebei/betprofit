import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Copy, ExternalLink } from 'lucide-react';
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
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const layBets = bet ? getLayBetsByParentId(bet.id) : [];
  const betLegs = bet ? getBetLegsByBetId(bet.id) : [];

  // Usa la funzione centralizzata per i calcoli
  const calculations = useMemo(
    () => getMultiplaCalculations(bet, layBets, betLegs),
    [bet, layBets, betLegs]
  );

  if (!bet) return null;

  const handleCloneLayBet = (layBet: any) => {
    setEditingLayBet(layBet);
    setFormMode('create');
    setShowLayBetForm(true);
  };

  const handleModifyLayBet = (layBet: any) => {
    setEditingLayBet(layBet);
    setFormMode('edit');
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
                  setFormMode('create');
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
                  <TableRow>
                    <TableCell>{format(new Date(bet.dataEvento), 'dd MMMM yyyy HH:mm')}</TableCell>
                    <TableCell className="font-medium">
                      {(() => {
                        const first = betLegs.length > 0
                          ? [...betLegs].sort((a, b) => new Date(a.dataEvento).getTime() - new Date(b.dataEvento).getTime())[0]
                          : null;
                        return first ? first.evento : (bet.evento || 'MULTIPLA');
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const first = betLegs.length > 0
                          ? [...betLegs].sort((a, b) => new Date(a.dataEvento).getTime() - new Date(b.dataEvento).getTime())[0]
                          : null;
                        return first?.competizione || '-';
                      })()}
                    </TableCell>
                    <TableCell>Multipla</TableCell>
                    <TableCell><Badge variant="outline">Punta</Badge></TableCell>
                    <TableCell><Badge variant="outline">{bet.tipoBonus || 'Nessuno'}</Badge></TableCell>
                    <TableCell>{bet.conto}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(bet.stake)}</TableCell>
                    <TableCell>{bet.quotaCombinata?.toFixed(3) || bet.quota?.toFixed(3)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                    <TableCell>{formatCurrency(bet.bonus || 0)}</TableCell>
                    <TableCell>{formatCurrency(bet.rimborso || 0)}</TableCell>
                    <TableCell>0,00</TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        bet.stato === 'Vinto' ? 'default' :
                        bet.stato === 'Perso' ? 'destructive' :
                        bet.stato === 'In Corso' ? 'warning' :
                        'secondary'
                      }>{bet.stato || 'Bozza'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{bet.tag || '-'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm('Eliminare questa puntata?')) { /* delete handled by parent */ } }}>Elimina</Button>
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
                    
                    const currentIndex = layBets.findIndex(lb => lb.id === layBet.id);
                    const hasPreviousWonBet = layBets.slice(0, currentIndex).some(lb => lb.stato === 'Vinto');

                    return (
                      <TableRow key={layBet.id} className="bg-muted/30">
                        <TableCell>{format(new Date(layBet.dataEvento), 'dd MMMM yyyy HH:mm')}</TableCell>
                        <TableCell className="font-medium">{layBet.evento}</TableCell>
                        <TableCell>{layBet.competizione || (() => {
                          const matchingLeg = betLegs.find(leg => leg.evento === layBet.evento);
                          return matchingLeg?.competizione || '-';
                        })()}</TableCell>
                        <TableCell>{layBet.mercato}</TableCell>
                        <TableCell><Badge variant="outline">Banca</Badge></TableCell>
                        {/* Tipo Bonus: link esterno se disponibile */}
                        <TableCell>
                          {layBet.urlEvento
                            ? <Button size="sm" variant="ghost" className="text-blue-500 p-1 h-auto" onClick={() => window.open(layBet.urlEvento, '_blank')}><ExternalLink className="h-4 w-4" /></Button>
                            : '-'}
                        </TableCell>
                        <TableCell>{layBet.conto}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(layBet.stake)}</TableCell>
                        {/* Quota Punta - colore bookmaker */}
                        <TableCell className="font-semibold text-center" style={{ backgroundColor: '#87c4e8', color: '#0d2035' }}>{layBet.quotaPunta.toFixed(3)}</TableCell>
                        {/* Quota Banca - colore exchange */}
                        <TableCell className="font-semibold text-center" style={{ backgroundColor: '#f4a9ba', color: '#2d0d1a' }}>{layBet.quotaBanca.toFixed(3)}</TableCell>
                        <TableCell className="text-red-600 font-semibold">{formatCurrency(rischio)}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell>{layBet.tassePercentuale > 0 ? layBet.tassePercentuale.toFixed(2) : '0,00'}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        {/* Stato Evento */}
                        <TableCell>
                          {hasPreviousWonBet ? (
                            <Badge variant="secondary">Bozza</Badge>
                          ) : (
                            <Select
                              value={layBet.stato}
                              onValueChange={async (value) => {
                                await updateLayBet(layBet.id, { stato: value as LayBet['stato'] });
                                if (value === 'Vinto') {
                                  if (currentIndex > 0) await updateLayBet(layBets[currentIndex - 1].id, { stato: 'Perso' });
                                  for (const nb of layBets.slice(currentIndex + 1)) await updateLayBet(nb.id, { stato: 'Bozza' });
                                }
                              }}
                            >
                              <SelectTrigger className="w-[110px]">
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
                          )}
                        </TableCell>
                        <TableCell className="text-sm">-</TableCell>
                        {/* Opzioni */}
                        <TableCell>
                          <div className="flex gap-1 flex-nowrap">
                            <Button size="sm" variant="ghost" onClick={() => handleCloneLayBet(layBet)}>Clona</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleModifyLayBet(layBet)}>Punta</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteLayBet(layBet.id)}>Elimina</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Riga Totali */}
                  <TableRow className="bg-muted/50 border-t-2">
                    <TableCell colSpan={8}></TableCell>
                    <TableCell colSpan={2} className="text-right font-semibold pr-1 whitespace-nowrap">Totale Rischio</TableCell>
                    <TableCell className="font-bold text-lg text-red-600">
                      {formatCurrency(calculations.totalRisk)}
                    </TableCell>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="text-right font-semibold pr-1 whitespace-nowrap">Guadagno Totale</TableCell>
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
                    <TableCell colSpan={2}></TableCell>
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
          mode={formMode}
          betLegs={betLegs}
        />
      )}
    </>
  );
}

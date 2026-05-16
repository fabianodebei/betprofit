import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ExternalLink } from 'lucide-react';
import { Bet, LayBet } from '@/types';
import { useLayBets } from '@/contexts/LayBetContext';
import { useBets } from '@/contexts/BetContext';
import { LayBetForm } from '@/components/forms/LayBetForm';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';

interface SingleBetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bet: Bet | null;
}

function statoTriggerClass(stato: string): string {
  switch (stato) {
    case 'In Corso': return 'border-green-500 text-green-600';
    case 'Vinto': return 'border-green-600 bg-green-50 text-green-700';
    case 'Perso': return 'border-red-500 text-red-600';
    case 'Annullato': return 'border-gray-400 text-gray-500';
    default: return '';
  }
}

function sportEmoji(mercato?: string): string {
  const m = (mercato || '').toLowerCase();
  if (m.includes('calcio') || m.includes('calcio')) return '⚽';
  if (m.includes('tennis')) return '🎾';
  if (m.includes('basket')) return '🏀';
  return '🏅';
}

export function SingleBetDetailDialog({ open, onOpenChange, bet: betProp }: SingleBetDetailDialogProps) {
  const { getLayBetsByParentId, deleteLayBet, updateLayBet } = useLayBets();
  const { updateBet } = useBets();
  const [showLayBetForm, setShowLayBetForm] = useState(false);
  const [editingLayBet, setEditingLayBet] = useState<any>(null);
  const [statoLocale, setStatoLocale] = useState<Bet['stato']>(betProp?.stato || 'Bozza');

  // Sincronizza stato locale quando cambia la bet prop
  useEffect(() => {
    if (betProp?.stato) setStatoLocale(betProp.stato);
  }, [betProp?.stato, open]);

  const bet = betProp;

  const layBets = bet ? getLayBetsByParentId(bet.id) : [];

  const calculations = useMemo(() => {
    if (!bet) return { totalRisk: 0, guadagnoGarantito: 0, scenarioVincita: 0, scenarioPerdita: 0 };

    let puntaWin: number, puntaLoss: number;
    if (bet.tipoBonus === 'Free Bet') {
      puntaWin = bet.stake * ((bet.quota || 1) - 1);
      puntaLoss = 0;
    } else if (bet.tipoBonus === 'Bonus' && bet.bonus) {
      puntaWin = (bet.stake + bet.bonus) * (bet.quota || 1) - bet.stake;
      puntaLoss = -bet.stake;
    } else {
      puntaWin = bet.stake * (bet.quota || 1) - bet.stake;
      puntaLoss = -bet.stake;
    }

    // Totale rischio = somma delle liability (rischi) delle bancate attive
    const totalRisk = layBets.reduce((sum, lb) => {
      if (lb.stato === 'Bozza' || lb.stato === 'Annullato') return sum;
      return sum + lb.stake * (lb.quotaBanca - 1);
    }, 0);

    // Se qualche bancata è ancora "In Corso", mostra il rischio negativo (esposizione massima sull'exchange)
    const hasInCorsoBancata = layBets.some(lb => lb.stato === 'In Corso');
    if (hasInCorsoBancata) {
      return { totalRisk, guadagnoGarantito: -totalRisk, scenarioVincita: 0, scenarioPerdita: 0 };
    }

    const sumLiability = layBets.reduce((sum, lb) => {
      if (lb.stato === 'Vinto' || lb.stato === 'Bozza' || lb.stato === 'Annullato') return sum;
      return sum + lb.stake * (lb.quotaBanca - 1);
    }, 0);

    const sumLayWins = layBets.reduce((sum, lb) => {
      if (lb.stato === 'Perso' || lb.stato === 'Bozza' || lb.stato === 'Annullato') return sum;
      const profitLordo = lb.stake;
      const tasse = profitLordo * ((lb.tassePercentuale || 0) / 100);
      return sum + (profitLordo - tasse);
    }, 0);

    const scenarioVincita = puntaWin - sumLiability;
    const scenarioPerdita = puntaLoss + sumLayWins;
    const guadagnoGarantito = Math.min(scenarioVincita, scenarioPerdita);

    return { totalRisk, guadagnoGarantito, scenarioVincita, scenarioPerdita };
  }, [bet, layBets]);

  if (!bet) return null;

  const handleDeleteLayBet = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa bancata?')) {
      await deleteLayBet(id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[99vw] w-screen max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio Puntata #{bet.id.substring(0, 7)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingLayBet(null); setShowLayBetForm(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova Bancata
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="[&>th]:px-2 [&>th]:py-1.5 [&>th]:whitespace-nowrap">
                    <TableHead>Data Evento</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Competizione</TableHead>
                    <TableHead>Mercato</TableHead>
                    <TableHead>Metodo</TableHead>
                    <TableHead>Tipo Bonus</TableHead>
                    <TableHead>Conto</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Quota</TableHead>
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
                  <TableRow className="[&>td]:px-2 [&>td]:py-1.5">
                    <TableCell className="whitespace-nowrap">{format(new Date(bet.dataEvento), 'dd/MM HH:mm')}</TableCell>
                    <TableCell className="text-base">{sportEmoji(bet.mercato)}</TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">{bet.evento || '-'}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-primary">{bet.competizione || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{bet.mercato || '-'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{bet.metodo || 'Punta'}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{bet.tipoBonus || 'Nessuno'}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap">{bet.conto}</TableCell>
                    <TableCell className="font-semibold whitespace-nowrap">{formatCurrency(bet.stake)}</TableCell>
                    <TableCell className="text-center">{bet.quota?.toFixed(3) ?? '-'}</TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                    <TableCell>{formatCurrency(bet.bonus || 0)}</TableCell>
                    <TableCell>{formatCurrency(bet.rimborso || 0)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                    <TableCell>
                      <Select
                        value={statoLocale}
                        onValueChange={async (value) => {
                          const nuovoStato = value as Bet['stato'];
                          setStatoLocale(nuovoStato);
                          try {
                            await updateBet(bet.id, { stato: nuovoStato });
                          } catch {
                            setStatoLocale(bet.stato || 'Bozza');
                          }
                        }}
                      >
                        <SelectTrigger className={`h-7 w-[105px] text-xs px-2 ${statoTriggerClass(statoLocale)}`}>
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
                    <TableCell className="italic text-muted-foreground max-w-[100px] truncate">
                      {bet.tag || '(non impostato)'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs"
                          onClick={() => { setEditingLayBet(null); setShowLayBetForm(true); }}>
                          Clona
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-destructive"
                          onClick={() => { if (confirm('Eliminare questa puntata?')) {} }}>
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Lay Bet Rows */}
                  {layBets.map((layBet) => {
                    const rischio = layBet.stake * (layBet.quotaBanca - 1);
                    return (
                      <TableRow key={layBet.id} className="bg-muted/30 [&>td]:px-2 [&>td]:py-1.5">
                        <TableCell className="whitespace-nowrap">{format(new Date(layBet.dataEvento), 'dd/MM HH:mm')}</TableCell>
                        <TableCell className="text-base">{sportEmoji(layBet.mercato)}</TableCell>
                        <TableCell className="font-medium max-w-[180px] truncate">{layBet.evento}</TableCell>
                        <TableCell className="max-w-[120px] truncate text-primary">{layBet.competizione || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{layBet.mercato}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">Banca</Badge></TableCell>
                        {/* Tipo Bonus: link esterno */}
                        <TableCell className="text-center">
                          {layBet.urlEvento
                            ? <Button size="sm" variant="ghost" className="text-blue-500 p-0.5 h-auto"
                                onClick={() => window.open(layBet.urlEvento, '_blank')}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{layBet.conto}</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">{formatCurrency(layBet.stake)}</TableCell>
                        <TableCell className="font-semibold text-center whitespace-nowrap" style={{ backgroundColor: '#f4a9ba', color: '#2d0d1a' }}>
                          {layBet.quotaBanca.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold whitespace-nowrap">{formatCurrency(rischio)}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell>{layBet.tassePercentuale > 0 ? layBet.tassePercentuale.toFixed(2) : '-'}</TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell>
                          <Select
                            value={layBet.stato}
                            onValueChange={async (value) => {
                              try {
                                await updateLayBet(layBet.id, { stato: value as LayBet['stato'] });
                                toast.success(`Bancata: ${value}`);
                              } catch (e: any) {
                                toast.error(`Errore bancata: ${e.message}`);
                              }
                            }}
                          >
                            <SelectTrigger className={`h-7 w-[95px] text-xs px-2 ${statoTriggerClass(layBet.stato)}`}>
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
                        <TableCell>-</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5 flex-nowrap">
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs"
                              onClick={() => { setEditingLayBet(layBet); setShowLayBetForm(true); }}>
                              Clona
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-destructive"
                              onClick={() => handleDeleteLayBet(layBet.id)}>
                              Elimina
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 border-t-2 [&>td]:px-2 [&>td]:py-1.5">
                    <TableCell colSpan={8}></TableCell>
                    <TableCell colSpan={2} className="text-right font-semibold whitespace-nowrap text-xs">Totale Rischio</TableCell>
                    <TableCell className="font-bold text-red-600 whitespace-nowrap">{formatCurrency(calculations.totalRisk)}</TableCell>
                    <TableCell colSpan={2}></TableCell>
                    <TableCell colSpan={2} className="text-right font-semibold whitespace-nowrap text-xs">Guadagno Totale</TableCell>
                    <TableCell className={`font-bold whitespace-nowrap ${statoLocale === 'Bozza' ? 'text-muted-foreground' : calculations.guadagnoGarantito >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {statoLocale === 'Bozza' ? formatCurrency(0) : formatCurrency(calculations.guadagnoGarantito)}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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

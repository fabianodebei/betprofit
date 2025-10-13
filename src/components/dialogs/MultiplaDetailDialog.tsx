import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Copy, Calculator, AlertCircle, GripVertical } from 'lucide-react';
import { Bet } from '@/types';
import { useLayBets } from '@/contexts/LayBetContext';
import { useBetLegs } from '@/contexts/BetLegContext';
import { LayBetForm } from '@/components/forms/LayBetForm';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { getMultiplaCalculations } from '@/utils/multiplaCalculations';
import { computeBalancedLayStakes2Legs } from '@/utils/accaCalculations';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MultiplaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bet: Bet | null;
}

interface SortableRowProps {
  layBet: any;
  onEdit: (layBet: any) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ layBet, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layBet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const rischio = layBet.stake * (layBet.quotaBanca - 1);
  const tasse = layBet.stake * (layBet.quotaBanca - 1) * (layBet.tassePercentuale / 100);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="bg-accent/5 border-l-4 border-l-accent"
    >
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing inline-flex items-center justify-center p-1 hover:bg-accent/20 rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
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
            onClick={() => onEdit(layBet)}
          >
            Clona
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(layBet)}
          >
            Punta
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(layBet.id)}
          >
            Elimina
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function MultiplaDetailDialog({ open, onOpenChange, bet }: MultiplaDetailDialogProps) {
  const { getLayBetsByParentId, deleteLayBet } = useLayBets();
  const { getBetLegsByBetId } = useBetLegs();
  const [showLayBetForm, setShowLayBetForm] = useState(false);
  const [editingLayBet, setEditingLayBet] = useState<any>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [targetLoss, setTargetLoss] = useState<number>(5);
  const [orderedLayBets, setOrderedLayBets] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const layBets = bet ? getLayBetsByParentId(bet.id) : [];
  const betLegs = bet ? getBetLegsByBetId(bet.id) : [];

  // Sync ordered lay bets with actual lay bets
  useEffect(() => {
    setOrderedLayBets(layBets);
  }, [layBets]);

  // Usa la funzione centralizzata per i calcoli con l'ordine attuale
  const calculations = useMemo(
    () => getMultiplaCalculations(bet, orderedLayBets, betLegs),
    [bet, orderedLayBets, betLegs]
  );

  // Calcola stake suggeriti e sbilanciamento
  const suggestedStakes = useMemo(() => {
    if (!bet || !betLegs || betLegs.length !== 2) return null;
    
    const quotaMultipla = bet.quotaCombinata || bet.quota || 
      betLegs.reduce((prod: number, leg: any) => prod * (Number(leg.quota) || 1), 1);

    let quotaLay1 = betLegs[0]?.quota || 1.01;
    let quotaLay2 = betLegs[1]?.quota || 1.01;
    let commission1 = 0.045;
    let commission2 = 0.045;

    if (orderedLayBets.length >= 1) {
      quotaLay1 = orderedLayBets[0].quotaBanca || orderedLayBets[0].quotaPunta || quotaLay1;
      commission1 = (orderedLayBets[0].tassePercentuale || 0) / 100;
    }
    if (orderedLayBets.length >= 2) {
      quotaLay2 = orderedLayBets[1].quotaBanca || orderedLayBets[1].quotaPunta || quotaLay2;
      commission2 = (orderedLayBets[1].tassePercentuale || 0) / 100;
    }

    return computeBalancedLayStakes2Legs({
      stakeMultipla: bet.stake,
      quotaMultipla,
      quotaLay1,
      quotaLay2,
      commission1,
      commission2,
      targetLoss: showCalculator ? targetLoss : undefined,
    });
  }, [bet, betLegs, orderedLayBets, showCalculator, targetLoss]);

  const currentImbalance = useMemo(() => {
    if (!calculations?.perGamba || calculations.perGamba.length < 2) return null;
    const diff = Math.abs(calculations.perGamba[0].risultato - calculations.perGamba[1].risultato);
    return diff;
  }, [calculations]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedLayBets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Dettaglio Puntata #{bet.id.substring(0, 7)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(!showCalculator)}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {showCalculator ? 'Nascondi' : 'Calcolatore'}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Calcolatore Stake Suggeriti */}
            {showCalculator && betLegs && betLegs.length === 2 && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calcolatore Stake Bilanciati
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetLoss">Perdita Target (€)</Label>
                    <Input
                      id="targetLoss"
                      type="number"
                      step="0.01"
                      value={targetLoss}
                      onChange={(e) => setTargetLoss(Number(e.target.value))}
                      placeholder="5.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Inserisci una perdita target o lascia vuoto per bilanciare automaticamente
                    </p>
                  </div>
                </div>

                {suggestedStakes && (
                  <div className="space-y-3 bg-background p-3 rounded border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Stake Lay Gamba 1</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(suggestedStakes.stake1)}</p>
                        <p className="text-xs text-muted-foreground">Liability: {formatCurrency(suggestedStakes.liability1)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Stake Lay Gamba 2</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(suggestedStakes.stake2)}</p>
                        <p className="text-xs text-muted-foreground">Liability: {formatCurrency(suggestedStakes.liability2)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-green-500/10 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Se vinci multipla</p>
                        <p className="font-semibold text-green-600">{formatCurrency(suggestedStakes.scenarioWin)}</p>
                      </div>
                      <div className="bg-red-500/10 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Se perde gamba 1</p>
                        <p className="font-semibold text-red-600">{formatCurrency(suggestedStakes.scenarioLossLeg1)}</p>
                      </div>
                      <div className="bg-red-500/10 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Se perde gamba 2</p>
                        <p className="font-semibold text-red-600">{formatCurrency(suggestedStakes.scenarioLossLeg2)}</p>
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Sbilanciamento: {formatCurrency(suggestedStakes.imbalance)}</strong>
                        <br />
                        Usa questi stake quando crei le bancate per minimizzare la perdita massima.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}

            {/* Sbilanciamento Attuale */}
            {currentImbalance !== null && currentImbalance > 5 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sbilanciamento rilevato: {formatCurrency(currentImbalance)}</strong>
                  <br />
                  Le tue bancate attuali hanno una differenza significativa tra gli scenari di perdita.
                  Usa il calcolatore per bilanciare gli stake.
                </AlertDescription>
              </Alert>
            )}

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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
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
                    <TableRow className="bg-primary/5 border-l-4 border-l-primary">
                      <TableCell></TableCell>
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
                      <TableCell>
                        <Badge variant={bet.stato === 'In Corso' ? 'default' : 'secondary'}>
                          {bet.stato}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary text-sm">{bet.tag || '(non impostato)'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          Clona
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Lay Bets Rows - Sortable */}
                    <SortableContext
                      items={orderedLayBets.map((lb) => lb.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedLayBets.map((layBet) => (
                        <SortableRow
                          key={layBet.id}
                          layBet={layBet}
                          onEdit={handleEditLayBet}
                          onDelete={handleDeleteLayBet}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </div>

            {/* Totals with Scenarios */}
            <div className="space-y-3">
              {/* Main scenarios */}
              <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-muted/30 rounded-lg border border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Multipla Vinta</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Risultato: </span>
                    <span className={`font-semibold ${calculations.scenarioVincita >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculations.scenarioVincita)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Multipla Persa (Migliore)</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Risultato: </span>
                    <span className={`font-semibold ${calculations.scenarioPerditaBest >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculations.scenarioPerditaBest)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Multipla Persa (Peggiore)</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Risultato: </span>
                    <span className={`font-semibold ${calculations.scenarioPerditaWorst >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculations.scenarioPerditaWorst)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-leg breakdown */}
              {calculations.perGamba.length > 0 && (
                <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-2">Se multipla perde per gamba:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {calculations.perGamba.map((gamba: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className="text-muted-foreground">Gamba {idx + 1}: </span>
                        <span className={`font-semibold ${gamba.risultato >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(gamba.risultato)}
                        </span>
                        {gamba.label && (
                          <span className="text-xs text-muted-foreground ml-1">({gamba.label})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed summary sections */}
              <div className="grid grid-cols-3 gap-4">
                <div className="px-4 py-2 bg-muted/10 rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Stake Totale Puntato</div>
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(calculations.stakeMultipla)}
                  </div>
                </div>
                <div className="px-4 py-2 bg-muted/10 rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Stake Totale Bancato</div>
                  <div className="text-lg font-bold text-accent">
                    {formatCurrency(calculations.stakeTotaleBancato)}
                  </div>
                </div>
                <div className="px-4 py-2 bg-muted/10 rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Rischio Totale</div>
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(calculations.rischioTotale)}
                  </div>
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
          editingBet={editingLayBet}
          betLegs={betLegs}
        />
      )}
    </>
  );
}

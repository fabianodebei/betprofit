import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Bet } from '@/types';
import { useLayBets } from '@/contexts/LayBetContext';
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
  const [showLayBetForm, setShowLayBetForm] = useState(false);
  const [editingLayBet, setEditingLayBet] = useState<any>(null);

  const layBets = bet ? getLayBetsByParentId(bet.id) : [];

  // Calculate totals
  const calculations = useMemo(() => {
    if (!bet) return { totalRisk: 0, totalProfit: 0, netProfit: 0 };

    const totalRisk = layBets.reduce((sum, lb) => sum + lb.stake, 0);
    
    // Potential win from multipla
    const multiplaWin = bet.stake * (bet.quota || 0) - bet.stake;
    
    // Total liability from lay bets (what we lose if bets win)
    const layLiability = layBets.reduce((sum, lb) => {
      const liability = lb.metodo === 'Banca' 
        ? lb.stake * (lb.quotaBanca - 1) 
        : -lb.stake;
      return sum + liability;
    }, 0);

    // Net profit (simplified calculation)
    const netProfit = multiplaWin - layLiability - totalRisk;

    return {
      totalRisk,
      multiplaWin,
      layLiability,
      netProfit,
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio Multipla</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Multipla Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Multipla</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Evento</p>
                    <p className="font-medium">{bet.evento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{format(new Date(bet.dataEvento), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conto</p>
                    <p className="font-medium">{bet.conto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stake</p>
                    <p className="font-medium">{formatCurrency(bet.stake)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quota</p>
                    <p className="font-medium">{bet.quota?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vincita Potenziale</p>
                    <p className="font-medium text-success">{formatCurrency(bet.stake * (bet.quota || 0))}</p>
                  </div>
                </div>
                {bet.note && (
                  <div>
                    <p className="text-sm text-muted-foreground">Note</p>
                    <p className="font-medium">{bet.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calculations */}
            <Card>
              <CardHeader>
                <CardTitle>Calcoli</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vincita Multipla</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(calculations.multiplaWin)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Totale Rischio</p>
                    <p className="text-lg font-bold text-destructive">{formatCurrency(calculations.totalRisk)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Responsabilità Bancate</p>
                    <p className="text-lg font-bold text-warning">{formatCurrency(calculations.layLiability)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profitto Netto</p>
                    <p className={`text-lg font-bold ${calculations.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(calculations.netProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lay Bets (Contropuntate) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contropuntate</CardTitle>
                <Button size="sm" onClick={() => {
                  setEditingLayBet(null);
                  setShowLayBetForm(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Bancata
                </Button>
              </CardHeader>
              <CardContent>
                {layBets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nessuna bancata associata. Clicca "Nuova Bancata" per aggiungerne una.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metodo</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Mercato</TableHead>
                          <TableHead>Conto</TableHead>
                          <TableHead>Stake</TableHead>
                          <TableHead>Q. Banca</TableHead>
                          <TableHead>Q. Punta</TableHead>
                          <TableHead>Tasse %</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {layBets.map((layBet) => (
                          <TableRow key={layBet.id}>
                            <TableCell>
                              <Badge variant={layBet.metodo === 'Punta' ? 'default' : 'secondary'}>
                                {layBet.metodo}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {layBet.evento}
                            </TableCell>
                            <TableCell>{layBet.mercato}</TableCell>
                            <TableCell>{layBet.conto}</TableCell>
                            <TableCell>{formatCurrency(layBet.stake)}</TableCell>
                            <TableCell>{layBet.quotaBanca.toFixed(2)}</TableCell>
                            <TableCell>{layBet.quotaPunta.toFixed(2)}</TableCell>
                            <TableCell>{layBet.tassePercentuale}%</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditLayBet(layBet)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteLayBet(layBet.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
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

import { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SingleBetForm } from '@/components/forms/SingleBetForm';
import { CasinoBetForm } from '@/components/forms/CasinoBetForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { useBets } from '@/contexts/BetContext';
import { formatDate } from '@/utils/dates';
import { ArchiveBetDialog } from '@/components/dialogs/ArchiveBetDialog';
import { Bet } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function OngoingBets() {
  const { getOngoingBets, deleteBet, archiveBet } = useBets();
  const [activeTab, setActiveTab] = useState<'singola' | 'multipla' | 'casino'>('singola');
  const [showSingleBetForm, setShowSingleBetForm] = useState(false);
  const [showCasinoBetForm, setShowCasinoBetForm] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailBet, setDetailBet] = useState<Bet | null>(null);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const ongoingBets = getOngoingBets();

  const handleArchive = (bet: Bet) => {
    setSelectedBet(bet);
    setShowArchiveDialog(true);
  };

  const handleConfirmArchive = (risultato: number) => {
    if (selectedBet) {
      archiveBet(selectedBet.id, risultato);
    }
  };

  const handleDetail = (bet: Bet) => {
    setDetailBet(bet);
    setShowDetailDialog(true);
  };

  const handleClone = (bet: Bet) => {
    setEditingBet(bet);
    if (bet.tipo === 'Casino') {
      setShowCasinoBetForm(true);
    } else {
      setShowSingleBetForm(true);
    }
  };

  const handleNewMultipla = () => {
    toast.info('Funzionalità multipla in arrivo');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Giocate In Corso</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <Button
          variant={activeTab === 'singola' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('singola');
            setShowSingleBetForm(true);
          }}
          className="rounded-b-none"
        >
          Nuova Singola
        </Button>
        <Button
          variant={activeTab === 'multipla' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('multipla');
            handleNewMultipla();
          }}
          className="rounded-b-none"
        >
          Nuova Multipla
        </Button>
        <Button
          variant={activeTab === 'casino' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('casino');
            setShowCasinoBetForm(true);
          }}
          className="rounded-b-none"
        >
          Nuova Puntata Casinò
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Puntate Attive</CardTitle>
        </CardHeader>
        <CardContent>
          {ongoingBets.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="Nessuna puntata in corso"
              description="Inizia con 'Nuova Singola' per creare la tua prima puntata."
              action={
                <Button onClick={() => setShowSingleBetForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova Singola
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-xs font-semibold uppercase">ID#</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Data Evento</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Tipo</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Evento</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Tipo Bonus</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Tag</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Note</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {ongoingBets.map((bet, idx) => (
                    <tr key={bet.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 text-sm font-medium">{bet.id}</td>
                      <td className="p-3 text-sm">{formatDate(bet.dataEvento)}</td>
                      <td className="p-3">
                        <Badge variant="info">{bet.tipo}</Badge>
                      </td>
                      <td className="p-3 text-sm">{bet.evento || bet.nomeGioco || '-'}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{bet.tipoBonus || 'Nessuno'}</Badge>
                      </td>
                      <td className="p-3 text-sm">{bet.conto}</td>
                      <td className="p-3">
                        {bet.tag && <Badge variant="outline">{bet.tag}</Badge>}
                      </td>
                      <td className="p-3 text-sm">{bet.note || '-'}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleDetail(bet)}>Dettaglio</Button>
                          <Button size="sm" variant="outline" onClick={() => handleArchive(bet)}>Archivia</Button>
                          <Button size="sm" variant="outline" onClick={() => handleClone(bet)}>Clona</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteBet(bet.id)}>Elimina</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Visualizzo 1-{ongoingBets.length} di {ongoingBets.length} elementi
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SingleBetForm 
        open={showSingleBetForm} 
        onOpenChange={(open) => {
          setShowSingleBetForm(open);
          if (!open) setEditingBet(null);
        }}
        editingBet={editingBet}
      />
      <CasinoBetForm 
        open={showCasinoBetForm} 
        onOpenChange={(open) => {
          setShowCasinoBetForm(open);
          if (!open) setEditingBet(null);
        }}
        editingBet={editingBet}
      />
      <ArchiveBetDialog
        bet={selectedBet}
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onConfirm={handleConfirmArchive}
      />

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettaglio Puntata</DialogTitle>
          </DialogHeader>
          {detailBet && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium">{detailBet.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="info">{detailBet.tipo}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conto</p>
                  <p className="font-medium">{detailBet.conto}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Evento</p>
                  <p className="font-medium">{formatDate(detailBet.dataEvento)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stake</p>
                  <p className="font-medium">€{detailBet.stake}</p>
                </div>
                {detailBet.quota && (
                  <div>
                    <p className="text-sm text-muted-foreground">Quota</p>
                    <p className="font-medium">{detailBet.quota}</p>
                  </div>
                )}
                {detailBet.evento && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Evento</p>
                    <p className="font-medium">{detailBet.evento}</p>
                  </div>
                )}
                {detailBet.nomeGioco && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Nome Gioco</p>
                    <p className="font-medium">{detailBet.nomeGioco}</p>
                  </div>
                )}
                {detailBet.tipoBonus && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo Bonus</p>
                    <Badge variant="secondary">{detailBet.tipoBonus}</Badge>
                  </div>
                )}
                {detailBet.tag && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tag</p>
                    <Badge variant="outline">{detailBet.tag}</Badge>
                  </div>
                )}
                {detailBet.note && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Note</p>
                    <p className="font-medium">{detailBet.note}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SingleBetForm } from '@/components/forms/SingleBetForm';
import { CasinoBetForm } from '@/components/forms/CasinoBetForm';
import { MultiplaBetForm } from '@/components/forms/MultiplaBetForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { SortableTableHeader } from '@/components/common/SortableTableHeader';
import { SmartPagination } from '@/components/common/SmartPagination';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { AdvancedFilterBar } from '@/components/filters/AdvancedFilterBar';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useBets } from '@/contexts/BetContext';
import { useYear } from '@/contexts/YearContext';
import { useTags } from '@/contexts/TagContext';
import { formatDate } from '@/utils/dates';
import { ArchiveBetDialog } from '@/components/dialogs/ArchiveBetDialog';
import { MultiplaDetailDialog } from '@/components/dialogs/MultiplaDetailDialog';
import { SingleBetDetailDialog } from '@/components/dialogs/SingleBetDetailDialog';
import { Bet } from '@/types';

export default function OngoingBets() {
  const { getOngoingBets, deleteBet, archiveBet, loading } = useBets();
  const { selectedYear } = useYear();
  const { tags } = useTags();
  const allOngoingBets = getOngoingBets();
  const yearOngoingBets = allOngoingBets.filter(bet => bet.dataEvento.getFullYear() === selectedYear);
  
  const { filteredItems, filters, setFilters, sortBy, setSortBy, sortOrder, setSortOrder } = useAdvancedFilters(yearOngoingBets, {
    searchFields: ['evento', 'nomeGioco', 'conto', 'tag', 'note'],
    dateField: 'dataEvento',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const availableBookmakers = useMemo(() => 
    Array.from(new Set(yearOngoingBets.map(b => b.conto))), [yearOngoingBets]
  );
  const availableTags = useMemo(() => tags.map(t => t.nome), [tags]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const [activeTab, setActiveTab] = useState<'singola' | 'multipla' | 'casino'>('singola');
  const [showSingleBetForm, setShowSingleBetForm] = useState(false);
  const [showCasinoBetForm, setShowCasinoBetForm] = useState(false);
  const [showMultiplaBetForm, setShowMultiplaBetForm] = useState(false);
  const [showMultiplaDetailDialog, setShowMultiplaDetailDialog] = useState(false);
  const [showSingleBetDetailDialog, setShowSingleBetDetailDialog] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'clone'>('create');

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
    setEditingBet(bet);
    setFormMode('edit');
    if (bet.tipo === 'Casino') {
      setShowCasinoBetForm(true);
    } else if (bet.tipo === 'Multipla') {
      setShowMultiplaBetForm(true);
    } else {
      setShowSingleBetForm(true);
    }
  };

  const handleClone = (bet: Bet) => {
    setEditingBet(bet);
    setFormMode('clone');
    if (bet.tipo === 'Casino') {
      setShowCasinoBetForm(true);
    } else if (bet.tipo === 'Multipla') {
      setShowMultiplaBetForm(true);
    } else {
      setShowSingleBetForm(true);
    }
  };

  const handleNewMultipla = () => {
    setEditingBet(null);
    setFormMode('create');
    setShowMultiplaBetForm(true);
  };

  const handleShowMultiplaDetail = (bet: Bet) => {
    setSelectedBet(bet);
    setShowMultiplaDetailDialog(true);
  };

  const handleShowSingleBetDetail = (bet: Bet) => {
    setSelectedBet(bet);
    setShowSingleBetDetailDialog(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Giocate In Corso</h1>
        <AdvancedFilterBar
          filters={filters}
          onFilterChange={setFilters}
          resultCount={filteredItems.length}
          totalCount={yearOngoingBets.length}
          availableBookmakers={availableBookmakers}
          availableTags={availableTags}
        />
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
          {loading ? (
            <SkeletonTable rows={5} columns={9} />
          ) : filteredItems.length === 0 ? (
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
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-xs font-semibold uppercase">ID#</th>
                      <SortableTableHeader label="Data Evento" sortKey="dataEvento" currentSort={sortBy} currentOrder={sortOrder} onSort={setSortBy as any} />
                      <SortableTableHeader label="Tipo" sortKey="tipo" currentSort={sortBy} currentOrder={sortOrder} onSort={setSortBy as any} />
                      <SortableTableHeader label="Evento" sortKey="evento" currentSort={sortBy} currentOrder={sortOrder} onSort={setSortBy as any} />
                      <th className="p-3 text-left text-xs font-semibold uppercase">Tipo Bonus</th>
                      <SortableTableHeader label="Conto" sortKey="conto" currentSort={sortBy} currentOrder={sortOrder} onSort={setSortBy as any} />
                      <th className="p-3 text-left text-xs font-semibold uppercase">Tag</th>
                      <th className="p-3 text-left text-xs font-semibold uppercase">Note</th>
                      <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((bet, idx) => (
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
                          {bet.tipo === 'Multipla' && (
                            <Button size="sm" variant="outline" onClick={() => handleShowMultiplaDetail(bet)}>Dettagli</Button>
                          )}
                          {bet.tipo === 'Singola' && (
                            <Button size="sm" variant="outline" onClick={() => handleShowSingleBetDetail(bet)}>Dettagli</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDetail(bet)}>Modifica</Button>
                          <Button size="sm" variant="outline" onClick={() => handleArchive(bet)}>Archivia</Button>
                          <Button size="sm" variant="outline" onClick={() => handleClone(bet)}>Clona</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteBet(bet.id)}>Elimina</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredItems.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <SingleBetForm 
        open={showSingleBetForm} 
        onOpenChange={(open) => {
          setShowSingleBetForm(open);
          if (!open) {
            setEditingBet(null);
            setFormMode('create');
          }
        }}
        editingBet={editingBet}
        mode={formMode}
      />
      <CasinoBetForm 
        open={showCasinoBetForm} 
        onOpenChange={(open) => {
          setShowCasinoBetForm(open);
          if (!open) {
            setEditingBet(null);
            setFormMode('create');
          }
        }}
        editingBet={editingBet}
        mode={formMode}
      />
      <MultiplaBetForm 
        open={showMultiplaBetForm} 
        onOpenChange={(open) => {
          setShowMultiplaBetForm(open);
          if (!open) {
            setEditingBet(null);
            setFormMode('create');
          }
        }}
        editingBet={editingBet}
        mode={formMode}
      />
      <MultiplaDetailDialog
        open={showMultiplaDetailDialog}
        onOpenChange={setShowMultiplaDetailDialog}
        bet={selectedBet}
      />
      <SingleBetDetailDialog
        open={showSingleBetDetailDialog}
        onOpenChange={setShowSingleBetDetailDialog}
        bet={selectedBet}
      />
      <ArchiveBetDialog
        bet={selectedBet}
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Plus, Zap, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
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
import { useLayBets } from '@/contexts/LayBetContext';
import { useBetLegs } from '@/contexts/BetLegContext';
import { formatDate, formatDateTime } from '@/utils/dates';
import { formatCurrency } from '@/utils/currency';
import { ArchiveBetDialog } from '@/components/dialogs/ArchiveBetDialog';
import { MultiplaDetailDialog } from '@/components/dialogs/MultiplaDetailDialog';
import { MultiplaArchiveDialog } from '@/components/dialogs/MultiplaArchiveDialog';
import { SingleBetDetailDialog } from '@/components/dialogs/SingleBetDetailDialog';
import { Bet } from '@/types';

export default function OngoingBets() {
  const { getOngoingBets, deleteBet, archiveBet, loading } = useBets();
  const { selectedYear } = useYear();
  const { tags } = useTags();
  const { getLayBetsByParentId } = useLayBets();
  const { getBetLegsByBetId } = useBetLegs();
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
  const [showMultiplaArchiveDialog, setShowMultiplaArchiveDialog] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set());

  const toggleLayBets = (betId: string) => {
    setExpandedBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

  const handleArchive = (bet: Bet) => {
    setSelectedBet(bet);
    if (bet.tipo === 'Multipla') {
      setShowMultiplaArchiveDialog(true);
    } else {
      setShowArchiveDialog(true);
    }
  };

  const handleConfirmArchive = (risultato: number, outcome?: 'win' | 'loss' | 'refund', esitoDettaglio?: string) => {
    if (selectedBet) {
      archiveBet(selectedBet.id, risultato, outcome ?? 'win', esitoDettaglio);
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
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Giocate In Corso</h1>
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
      <div className="mb-4 md:mb-6 flex flex-wrap gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'singola' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveTab('singola');
            setShowSingleBetForm(true);
          }}
          className="rounded-b-none text-xs md:text-sm"
        >
          Nuova Singola
        </Button>
        <Button
          variant={activeTab === 'multipla' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveTab('multipla');
            handleNewMultipla();
          }}
          className="rounded-b-none text-xs md:text-sm"
        >
          Nuova Multipla
        </Button>
        <Button
          variant={activeTab === 'casino' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveTab('casino');
            setShowCasinoBetForm(true);
          }}
          className="rounded-b-none text-xs md:text-sm"
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
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <SortableTableHeader label="Data" sortKey="dataEvento" currentSort={sortBy} currentOrder={sortOrder} onSort={setSortBy as any} />
                      <SortableTableHeader label="Tipo" sortKey="tipo" currentSort={sortBy} currentOrder={sortOrder} onSort={setSortBy as any} />
                      <th className="p-2 md:p-3 text-left text-xs font-semibold uppercase">Evento</th>
                      <th className="p-2 md:p-3 text-left text-xs font-semibold uppercase hidden lg:table-cell">Bonus</th>
                      <SortableTableHeader label="Conto" sortKey="conto" currentSort={sortBy} currentOrder={sortOrder} onSort={setSortBy as any} />
                      <th className="p-2 md:p-3 text-left text-xs font-semibold uppercase hidden md:table-cell">Tag</th>
                      <th className="p-2 md:p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((bet, idx) => {
                      const layBets = getLayBetsByParentId(bet.id);
                      const isExpanded = expandedBets.has(bet.id);
                      const hasLayBets = layBets.length > 0;
                      
                      return (
                        <>
                          <tr key={bet.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="p-2 md:p-3 text-xs md:text-sm">
                              <div className="flex items-center gap-1 md:gap-2">
                                {hasLayBets && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleLayBets(bet.id)}
                                    className="h-5 w-5 md:h-6 md:w-6 p-0"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                                    )}
                                  </Button>
                                )}
                                <span className="whitespace-nowrap">{formatDateTime(bet.dataEvento)}</span>
                              </div>
                            </td>
                            <td className="p-2 md:p-3">
                              <div className="flex flex-col gap-1">
                                <Badge variant="info" className="text-xs">{bet.tipo}</Badge>
                                {hasLayBets && (
                                  <Badge variant="warning" className="text-xs whitespace-nowrap">
                                    {layBets.length} bancate
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-2 md:p-3 text-xs md:text-sm max-w-[200px] truncate">
                              {bet.tipo === 'Multipla' ? (
                                (() => {
                                  const legs = getBetLegsByBetId(bet.id);
                                  return legs.length > 0 
                                    ? legs.map(leg => leg.evento).join(', ')
                                    : bet.evento || bet.nomeGioco || '-';
                                })()
                              ) : (
                                bet.evento || bet.nomeGioco || '-'
                              )}
                            </td>
                            <td className="p-2 md:p-3 hidden lg:table-cell">
                              <Badge variant="secondary" className="text-xs">{bet.tipoBonus || 'Nessuno'}</Badge>
                            </td>
                            <td className="p-2 md:p-3 text-xs md:text-sm">{bet.conto}</td>
                            <td className="p-2 md:p-3 hidden md:table-cell">
                              {bet.tag && <Badge variant="outline" className="text-xs">{bet.tag}</Badge>}
                            </td>
                            <td className="p-2 md:p-3">
                              <div className="flex flex-col md:flex-row gap-1">
                                {bet.tipo === 'Multipla' && (
                                  <Button size="sm" variant="outline" onClick={() => handleShowMultiplaDetail(bet)} className="text-xs whitespace-nowrap">Dettagli</Button>
                                )}
                                {bet.tipo === 'Singola' && (
                                  <Button size="sm" variant="outline" onClick={() => handleShowSingleBetDetail(bet)} className="text-xs whitespace-nowrap">Dettagli</Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => handleDetail(bet)} className="text-xs hidden md:inline-flex">Modifica</Button>
                                <Button size="sm" variant="outline" onClick={() => handleArchive(bet)} className="text-xs">Archivia</Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteBet(bet.id)} className="text-xs hidden md:inline-flex">Elimina</Button>
                              </div>
                            </td>
                          </tr>
                          {/* Statistics row for multipla without lay bets */}
                          {bet.tipo === 'Multipla' && !hasLayBets && bet.vincitaPotenziale !== undefined && (
                            <tr className={`${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} border-t border-muted`}>
                              <td colSpan={8} className="p-3">
                                <div className="flex items-center justify-center gap-8 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Perdita massima:</span>
                                    <span className="font-semibold text-destructive">{formatCurrency(bet.stake)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Vincita potenziale:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(bet.vincitaPotenziale)}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                          {isExpanded && layBets.map((layBet) => {
                            const liability = layBet.stake * (layBet.quotaBanca - 1);
                            return (
                              <tr key={`lay-${layBet.id}`} className={`${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} border-l-4 border-l-warning`}>
                                <td className="p-3 text-sm pl-12">
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    {formatDateTime(layBet.dataEvento)}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Badge variant="warning">{layBet.metodo}</Badge>
                                </td>
                                <td className="p-3 text-sm">{layBet.evento}</td>
                                <td className="p-3 text-sm">
                                  <div className="text-xs">
                                    <div>Stake: {formatCurrency(layBet.stake)}</div>
                                    <div>Bancata: {formatCurrency(liability)}</div>
                                  </div>
                                </td>
                                <td className="p-3 text-sm">{layBet.conto}</td>
                                <td className="p-3 text-sm">
                                  <div className="text-xs">
                                    <div>Q.Punta: {layBet.quotaPunta}</div>
                                    <div>Q.Banca: {layBet.quotaBanca}</div>
                                  </div>
                                </td>
                                <td className="p-3 text-sm">{layBet.mercato}</td>
                                <td className="p-3">
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => handleShowSingleBetDetail(bet)}>Vedi Puntata</Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    })}
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
      <MultiplaArchiveDialog
        bet={selectedBet}
        open={showMultiplaArchiveDialog}
        onOpenChange={setShowMultiplaArchiveDialog}
        onConfirm={handleConfirmArchive}
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

import { useState, useMemo } from 'react';
import { Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { SortableTableHeader } from '@/components/common/SortableTableHeader';
import { SmartPagination } from '@/components/common/SmartPagination';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { AdvancedFilterBar } from '@/components/filters/AdvancedFilterBar';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useBets } from '@/contexts/BetContext';
import { useLayBets } from '@/contexts/LayBetContext';
import { useYear } from '@/contexts/YearContext';
import { useTags } from '@/contexts/TagContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate, formatDateTime } from '@/utils/dates';

export default function ArchivedBets() {
  const { getArchivedBets, reopenBet, deleteBet, loading } = useBets();
  const { layBets } = useLayBets();
  const { selectedYear } = useYear();
  const { tags } = useTags();
  const allArchivedBets = getArchivedBets();
  const archivedBets = allArchivedBets.filter(bet => bet.dataEvento.getFullYear() === selectedYear);

  // Calculate lay bets results
  const calculateLayBetResults = (betId: string, outcome: string, esitoDettaglio?: string) => {
    const associatedLayBets = layBets.filter(lb => lb.parentBetId === betId && lb.metodo === 'Banca' && ['In Corso', 'Vinto', 'Perso'].includes(lb.stato));
    let total = 0;
    
    associatedLayBets.forEach(lb => {
      if (outcome === 'win') {
        total -= lb.stake * (lb.quotaBanca - 1);
      } else if (outcome === 'loss') {
        if (esitoDettaglio && lb.id === esitoDettaglio) {
          const profittoLordo = lb.stake;
          const tasse = profittoLordo * (lb.tassePercentuale / 100);
          total += profittoLordo - tasse;
        } else if (esitoDettaglio) {
          total -= lb.stake * (lb.quotaBanca - 1);
        } else {
          const profittoLordo = lb.stake;
          const tasse = profittoLordo * (lb.tassePercentuale / 100);
          total += profittoLordo - tasse;
        }
      }
    });
    
    return total;
  };

  const {
    filteredItems,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useAdvancedFilters(archivedBets, {
    searchFields: ['evento', 'nomeGioco', 'conto', 'tag', 'note'],
    dateField: 'dataEvento',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const availableBookmakers = useMemo(() => {
    const bookmakers = new Set(archivedBets.map(bet => bet.conto));
    return Array.from(bookmakers);
  }, [archivedBets]);

  const availableTags = useMemo(() => {
    return tags.map(t => t.nome);
  }, [tags]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const totalArchived = filteredItems.reduce((sum, bet) => {
    const betResult = bet.risultato || 0;
    const layResult = calculateLayBetResults(bet.id, bet.esito || 'refund', bet.esitoDettaglio);
    return sum + betResult + layResult;
  }, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Giocate Archiviate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Totale: <span className="font-semibold text-foreground">{formatCurrency(totalArchived)}</span>
        </p>
      </div>

      <AdvancedFilterBar
        filters={filters}
        onFilterChange={setFilters}
        resultCount={filteredItems.length}
        totalCount={archivedBets.length}
        availableBookmakers={availableBookmakers}
        availableTags={availableTags}
      />

      <Card>
        <CardHeader>
          <CardTitle>Storico Puntate</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable rows={5} columns={10} />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="Nessuna giocata archiviata"
              description="Le puntate completate appariranno qui una volta archiviate."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-xs font-semibold uppercase">ID</th>
                      <SortableTableHeader
                        label="Tipo"
                        sortKey="tipo"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={setSortBy as any}
                      />
                      <SortableTableHeader
                        label="Data Evento"
                        sortKey="dataEvento"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={setSortBy as any}
                      />
                      <SortableTableHeader
                        label="Evento"
                        sortKey="evento"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={setSortBy as any}
                      />
                      <th className="p-3 text-left text-xs font-semibold uppercase">Tipo Bonus</th>
                      <SortableTableHeader
                        label="Conto"
                        sortKey="conto"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={setSortBy as any}
                      />
                      <th className="p-3 text-left text-xs font-semibold uppercase">Tag</th>
                      <th className="p-3 text-left text-xs font-semibold uppercase">Note</th>
                      <SortableTableHeader
                        label="Totale GM"
                        sortKey="risultato"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={setSortBy as any}
                      />
                      <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                  {paginatedItems.map((bet, idx) => {
                    const betResult = bet.risultato || 0;
                    const layResult = calculateLayBetResults(bet.id, bet.esito || 'refund', bet.esitoDettaglio);
                    const totalGM = betResult + layResult;
                    
                    return (
                      <tr key={bet.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="p-3 text-sm font-medium">{bet.id.slice(0, 8)}</td>
                        <td className="p-3">
                          <Badge variant="info">{bet.tipo}</Badge>
                        </td>
                        <td className="p-3 text-sm">{formatDateTime(bet.dataEvento)}</td>
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
                          <span className={`font-semibold ${totalGM > 0 ? 'text-success' : totalGM < 0 ? 'text-destructive' : ''}`}>
                            {formatCurrency(totalGM)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => reopenBet(bet.id)}>Riapri</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteBet(bet.id)}>Elimina</Button>
                          </div>
                        </td>
                      </tr>
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
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

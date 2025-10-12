import { useState, useMemo } from 'react';
import { Plus, Zap, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickBetForm } from '@/components/forms/QuickBetForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { SortableTableHeader } from '@/components/common/SortableTableHeader';
import { SmartPagination } from '@/components/common/SmartPagination';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { AdvancedFilterBar } from '@/components/filters/AdvancedFilterBar';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useBets } from '@/contexts/BetContext';
import { useYear } from '@/contexts/YearContext';
import { useTags } from '@/contexts/TagContext';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/dates';
import { Bet } from '@/types';

export default function QuickBets() {
  const { getQuickBets, deleteBet, loading } = useBets();
  const { selectedYear } = useYear();
  const { tags } = useTags();
  const allQuickBets = getQuickBets();
  const quickBets = allQuickBets.filter(bet => bet.createdAt.getFullYear() === selectedYear);
  const [showQuickBetForm, setShowQuickBetForm] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);

  const {
    filteredItems,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useAdvancedFilters(quickBets, {
    searchFields: ['conto', 'metodo', 'tag', 'note'],
    dateField: 'createdAt',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const availableBookmakers = useMemo(() => {
    const bookmakers = new Set(quickBets.map(bet => bet.conto));
    return Array.from(bookmakers);
  }, [quickBets]);

  const availableTags = useMemo(() => {
    return tags.map(t => t.nome);
  }, [tags]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const handleEdit = (bet: Bet) => {
    setEditingBet(bet);
    setShowQuickBetForm(true);
  };

  const handleCloseForm = () => {
    setShowQuickBetForm(false);
    setEditingBet(null);
  };

  const totalQuickBets = filteredItems.reduce((sum, bet) => sum + bet.stake, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Giocate Rapide</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saldo Giocate Rapide: <span className="font-semibold text-foreground">{formatCurrency(totalQuickBets)}</span>
          </p>
        </div>
        <Button onClick={() => setShowQuickBetForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Giocata
        </Button>
      </div>

      <AdvancedFilterBar
        filters={filters}
        onFilterChange={setFilters}
        resultCount={filteredItems.length}
        totalCount={quickBets.length}
        availableBookmakers={availableBookmakers}
        availableTags={availableTags}
        availableBetTypes={['Rapida']}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista Giocate Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable rows={5} columns={8} />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="Nessuna giocata rapida registrata"
              description="Le giocate rapide permettono di tracciare velocemente le tue puntate."
              action={
                <Button onClick={() => setShowQuickBetForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova Giocata
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-xs font-semibold uppercase">#</th>
                      <SortableTableHeader
                        label="Registrato"
                        sortKey="createdAt"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={setSortBy as any}
                      />
                      <SortableTableHeader
                        label="Conto"
                        sortKey="conto"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={setSortBy as any}
                      />
                      <th className="p-3 text-left text-xs font-semibold uppercase">Metodo</th>
                      <th className="p-3 text-left text-xs font-semibold uppercase">Tag</th>
                      <th className="p-3 text-left text-xs font-semibold uppercase">Note</th>
                      <SortableTableHeader
                        label="Movimento"
                        sortKey="stake"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={setSortBy as any}
                      />
                      <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((bet, idx) => (
                      <tr key={bet.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="p-3 text-sm">{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td className="p-3 text-sm">{formatDateTime(bet.createdAt)}</td>
                        <td className="p-3 text-sm">{bet.conto}</td>
                        <td className="p-3 text-sm">{bet.metodo || '-'}</td>
                        <td className="p-3 text-sm">{bet.tag || '-'}</td>
                        <td className="p-3 text-sm">{bet.note || '-'}</td>
                        <td className="p-3 text-sm font-semibold">{formatCurrency(bet.stake)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(bet)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteBet(bet.id)}>
                              Elimina
                            </Button>
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
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <QuickBetForm 
        open={showQuickBetForm} 
        onOpenChange={handleCloseForm}
        editingBet={editingBet}
      />
    </div>
  );
}

import { useState } from 'react';
import { useOddsMatcher } from '@/contexts/OddsMatcherContext';
import { FiltersSection } from '@/components/oddsmatcher/FiltersSection';
import { OpportunityTable } from '@/components/oddsmatcher/OpportunityTable';
import { OpportunityCard } from '@/components/oddsmatcher/OpportunityCard';
import { SendToTrackerDialog } from '@/components/dialogs/SendToTrackerDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Opportunity } from '@/types/oddsmatcher';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Oddsmatcher() {
  const {
    filteredOpportunities,
    loading,
    filters,
    fetchOpportunities,
    resetFilters,
  } = useOddsMatcher();

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  // Calculate opportunity counts by bet type
  const opportunityCounts = {
    singola: filteredOpportunities.length,
    multipla: 0,
    tre_vie: 0,
    best_odds: filteredOpportunities.length,
    best_opposite: filteredOpportunities.length,
    sure_bet: filteredOpportunities.filter(opp => opp.rating > 100).length,
  };

  const handleSendToTracker = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setSendDialogOpen(true);
  };

  const handleShowDetails = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setDetailsDialogOpen(true);
  };

  const handleSearch = () => {
    fetchOpportunities(filters);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Oddsmatcher Prematch</h1>
          <p className="text-muted-foreground">
            Trova le migliori opportunità di matched betting in tempo reale
          </p>
        </div>
      </div>

      {/* Filters */}
      <FiltersSection
        filters={filters}
        onFiltersChange={() => {}}
        onSearch={handleSearch}
        loading={loading}
        onClearFilters={resetFilters}
        opportunityCounts={opportunityCounts}
      />

      {/* Results */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filteredOpportunities.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                📊 Trovate {filteredOpportunities.length} opportunità
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-4">
                  {filteredOpportunities.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      onSendToTracker={handleSendToTracker}
                      onShowDetails={handleShowDetails}
                    />
                  ))}
                </div>
              ) : (
                <OpportunityTable
                  opportunities={filteredOpportunities}
                  onSendToTracker={handleSendToTracker}
                  onShowDetails={handleShowDetails}
                />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Send to Tracker Dialog */}
      <SendToTrackerDialog
        opportunity={selectedOpportunity}
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
      />

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dettagli Opportunità</DialogTitle>
          </DialogHeader>
          {selectedOpportunity && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Evento</h3>
                <p className="text-sm">{selectedOpportunity.eventName}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedOpportunity.competition}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data e Ora</h3>
                <p className="text-sm">
                  {format(new Date(selectedOpportunity.eventDate), 'EEEE dd MMMM yyyy, HH:mm', {
                    locale: it,
                  })}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Mercato</h3>
                <p className="text-sm">{selectedOpportunity.market}</p>
                <p className="text-xs text-muted-foreground">
                  Selezione: {selectedOpportunity.selection}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Bookmaker</h3>
                  <Badge className="bg-blue-100 text-blue-900 mb-1">
                    {selectedOpportunity.bookmaker}
                  </Badge>
                  <p className="text-lg font-bold">
                    Quota: {selectedOpportunity.quotaPunta.toFixed(2)}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Exchange</h3>
                  <Badge className="bg-orange-100 text-orange-900 mb-1">
                    {selectedOpportunity.exchange}
                  </Badge>
                  <p className="text-lg font-bold">
                    Quota: {selectedOpportunity.quotaBanca.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Commissione: {selectedOpportunity.commission}%
                  </p>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Rating:</span>
                  <Badge className="bg-green-500 text-white">
                    {selectedOpportunity.rating.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Profitto stimato:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(selectedOpportunity.profitEstimate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Stake suggerito:</span>
                  <span className="font-bold">
                    {formatCurrency(selectedOpportunity.suggestedStake)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Responsabilità:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(selectedOpportunity.liability)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

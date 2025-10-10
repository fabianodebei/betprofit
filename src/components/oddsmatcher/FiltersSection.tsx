import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { FilterState, BetType } from '@/types/oddsmatcher';
import { TopActionBar } from './TopActionBar';
import { BetTypeTabs } from './BetTypeTabs';

interface FiltersSectionProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch: () => void;
  loading: boolean;
  onClearFilters: () => void;
  opportunityCounts: Record<BetType, number>;
}

const SPORTS = [
  { value: 'tutti', label: 'Tutti gli Sport' },
  { value: 'soccer', label: 'Calcio' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'basketball', label: 'Basket' },
];

const SOCCER_MARKETS = [
  '1 Calcio',
  'X Calcio',
  '2 Calcio',
  'Under 2.5',
  'Over 2.5',
  'GG',
  'NG',
];

const BOOKMAKERS = [
  'bet365',
  'williamhill',
  'unibet',
  '888sport',
  'betway',
  'snai',
  'sisal',
  'eurobet',
  'betflag',
];

const COMPETITIONS = [
  { value: 'tutti', label: 'Tutti i Campionati' },
  { value: 'Serie A', label: 'Serie A' },
  { value: 'Serie B', label: 'Serie B' },
  { value: 'Champions League', label: 'Champions League' },
  { value: 'Europa League', label: 'Europa League' },
  { value: 'Premier League', label: 'Premier League' },
  { value: 'La Liga', label: 'La Liga' },
];

export const FiltersSection = ({
  filters,
  onFiltersChange,
  onSearch,
  loading,
  onClearFilters,
  opportunityCounts,
}: FiltersSectionProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [filtersOpen, setFiltersOpen] = useState(() => {
    const saved = localStorage.getItem('oddsmatcher_filters_open');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('oddsmatcher_filters_open', JSON.stringify(filtersOpen));
  }, [filtersOpen]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleExchangeToggle = (exchange: 'betfair' | 'betflag', enabled: boolean) => {
    const updated = {
      ...localFilters,
      exchanges: {
        ...localFilters.exchanges,
        [exchange]: {
          ...localFilters.exchanges[exchange],
          enabled,
        },
      },
    };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleExchangeCommission = (exchange: 'betfair' | 'betflag', commission: number) => {
    const updated = {
      ...localFilters,
      exchanges: {
        ...localFilters.exchanges,
        [exchange]: {
          ...localFilters.exchanges[exchange],
          commission,
        },
      },
    };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleBookmakerToggle = (bookmaker: string) => {
    const bookmakers = localFilters.bookmakers.includes(bookmaker)
      ? localFilters.bookmakers.filter((b) => b !== bookmaker)
      : [...localFilters.bookmakers, bookmaker];
    handleFilterChange('bookmakers', bookmakers);
  };

  const handleMarketToggle = (market: string) => {
    const markets = localFilters.markets.includes(market)
      ? localFilters.markets.filter((m) => m !== market)
      : [...localFilters.markets, market];
    handleFilterChange('markets', markets);
  };

  return (
    <div className="space-y-4">
      <TopActionBar
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
        filtersOpen={filtersOpen}
        onRefresh={onSearch}
        onClearFilters={onClearFilters}
        loading={loading}
      />

      <BetTypeTabs
        activeType={localFilters.betType}
        onChange={(type) => handleFilterChange('betType', type)}
        counts={opportunityCounts}
      />

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sport */}
              <div className="space-y-2">
                <Label>Sport</Label>
                <Select
                  value={localFilters.sport}
                  onValueChange={(value) => handleFilterChange('sport', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((sport) => (
                      <SelectItem key={sport.value} value={sport.value}>
                        {sport.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mercato */}
              <div className="space-y-2">
                <Label>Mercato</Label>
                <div className="border rounded-md p-3 bg-background max-h-32 overflow-y-auto">
                  <div className="space-y-2">
                    {SOCCER_MARKETS.map((market) => (
                      <div key={market} className="flex items-center space-x-2">
                        <Checkbox
                          id={`market-${market}`}
                          checked={localFilters.markets.includes(market)}
                          onCheckedChange={() => handleMarketToggle(market)}
                        />
                        <Label htmlFor={`market-${market}`} className="text-sm cursor-pointer">
                          {market}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bookmaker */}
              <div className="space-y-2">
                <Label>Bookmaker</Label>
                <div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-950/20 max-h-32 overflow-y-auto">
                  <div className="space-y-2">
                    {BOOKMAKERS.map((bookmaker) => (
                      <div key={bookmaker} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bookmaker-${bookmaker}`}
                          checked={localFilters.bookmakers.includes(bookmaker)}
                          onCheckedChange={() => handleBookmakerToggle(bookmaker)}
                        />
                        <Label htmlFor={`bookmaker-${bookmaker}`} className="text-sm cursor-pointer">
                          {bookmaker}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exchange */}
              <div className="space-y-2">
                <Label>Exchange</Label>
                <div className="border rounded-md p-3 bg-pink-50 dark:bg-pink-950/20 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="betfair"
                          checked={localFilters.exchanges.betfair.enabled}
                          onCheckedChange={(checked) =>
                            handleExchangeToggle('betfair', checked as boolean)
                          }
                        />
                        <Label htmlFor="betfair" className="cursor-pointer">
                          Betfair
                        </Label>
                      </div>
                      <Input
                        type="number"
                        value={localFilters.exchanges.betfair.commission}
                        onChange={(e) =>
                          handleExchangeCommission('betfair', parseFloat(e.target.value))
                        }
                        className="w-20 h-8"
                        step="0.5"
                        min="0"
                        max="10"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="betflag"
                          checked={localFilters.exchanges.betflag.enabled}
                          onCheckedChange={(checked) =>
                            handleExchangeToggle('betflag', checked as boolean)
                          }
                        />
                        <Label htmlFor="betflag" className="cursor-pointer">
                          Betflag Exchange
                        </Label>
                      </div>
                      <Input
                        type="number"
                        value={localFilters.exchanges.betflag.commission}
                        onChange={(e) =>
                          handleExchangeCommission('betflag', parseFloat(e.target.value))
                        }
                        className="w-20 h-8"
                        step="0.5"
                        min="0"
                        max="10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stake Punta & Free Bet */}
              <div className="space-y-2">
                <Label>Stake Punta</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={localFilters.stakePunta}
                    onChange={(e) => handleFilterChange('stakePunta', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1"
                    step="10"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">€</span>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="freebet"
                      checked={localFilters.isFreeBet}
                      onCheckedChange={(checked) => handleFilterChange('isFreeBet', checked as boolean)}
                    />
                    <Label htmlFor="freebet" className="text-sm cursor-pointer whitespace-nowrap">
                      Free Bet
                    </Label>
                  </div>
                </div>
              </div>

              {/* Bonus & Rimborso */}
              <div className="space-y-2">
                <Label>Bonus</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={localFilters.bonus}
                    onChange={(e) => handleFilterChange('bonus', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1 bg-yellow-50 dark:bg-yellow-950/20"
                    step="5"
                    min="0"
                  />
                  <span className="text-sm text-muted-foreground">€</span>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rimborso"
                      checked={localFilters.isRimborso}
                      onCheckedChange={(checked) => handleFilterChange('isRimborso', checked as boolean)}
                    />
                    <Label htmlFor="rimborso" className="text-sm cursor-pointer whitespace-nowrap">
                      Rimborso
                    </Label>
                  </div>
                </div>
              </div>

              {/* Quota Minima */}
              <div className="space-y-2">
                <Label>Quota Minima</Label>
                <Input
                  type="number"
                  value={localFilters.quotaMinima}
                  onChange={(e) => handleFilterChange('quotaMinima', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.05"
                  min="1"
                />
              </div>

              {/* Quota Massima */}
              <div className="space-y-2">
                <Label>Quota Massima</Label>
                <Input
                  type="number"
                  value={localFilters.quotaMassima}
                  onChange={(e) => handleFilterChange('quotaMassima', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.05"
                  min="1"
                />
              </div>

              {/* Rating Minimo */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between">
                  <Label>Rating Minimo</Label>
                  <span className="text-sm text-muted-foreground">{localFilters.minRating}%</span>
                </div>
                <Slider
                  value={[localFilters.minRating]}
                  onValueChange={(value) => handleFilterChange('minRating', value[0])}
                  min={50}
                  max={100}
                  step={5}
                />
              </div>

              {/* Ricerca Partita */}
              <div className="space-y-2">
                <Label>Ricerca Partita</Label>
                <Input
                  type="text"
                  value={localFilters.searchPartita}
                  onChange={(e) => handleFilterChange('searchPartita', e.target.value)}
                  placeholder="Cerca per nome..."
                />
              </div>

              {/* Campionato */}
              <div className="space-y-2">
                <Label>Campionato</Label>
                <Select
                  value={localFilters.searchCampionato}
                  onValueChange={(value) => handleFilterChange('searchCampionato', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPETITIONS.map((comp) => (
                      <SelectItem key={comp.value} value={comp.value}>
                        {comp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data Inizio */}
              <div className="space-y-2">
                <Label>Da Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !localFilters.dataInizio && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dataInizio ? (
                        format(localFilters.dataInizio, 'dd/MM/yyyy', { locale: it })
                      ) : (
                        <span>Seleziona data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dataInizio || undefined}
                      onSelect={(date) => handleFilterChange('dataInizio', date || null)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Fine */}
              <div className="space-y-2">
                <Label>A Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !localFilters.dataFine && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dataFine ? (
                        format(localFilters.dataFine, 'dd/MM/yyyy', { locale: it })
                      ) : (
                        <span>Seleziona data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dataFine || undefined}
                      onSelect={(date) => handleFilterChange('dataFine', date || null)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={onSearch} disabled={loading} className="w-full" size="lg">
                {loading ? 'Ricerca in corso...' : 'Cerca Opportunità'}
              </Button>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

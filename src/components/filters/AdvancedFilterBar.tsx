import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface FilterState {
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  bookmakers: string[];
  tags: string[];
  betTypes: string[];
  intestatari: string[];
  stakeMin: number | null;
  stakeMax: number | null;
}

interface AdvancedFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  resultCount: number;
  totalCount: number;
  availableBookmakers?: string[];
  availableTags?: string[];
  availableBetTypes?: string[];
  availableIntestatari?: string[];
}

export function AdvancedFilterBar({
  filters,
  onFilterChange,
  resultCount,
  totalCount,
  availableBookmakers = [],
  availableTags = [],
  availableBetTypes = ['Singola', 'Multipla', 'Casino', 'Rapida'],
  availableIntestatari = [],
}: AdvancedFilterBarProps) {
  const hasActiveFilters = filters.search || filters.dateFrom || filters.dateTo || 
    filters.bookmakers.length > 0 || filters.tags.length > 0 || filters.betTypes.length > 0 ||
    filters.intestatari.length > 0 || filters.stakeMin !== null || filters.stakeMax !== null;

  const resetFilters = () => {
    onFilterChange({
      search: '',
      dateFrom: null,
      dateTo: null,
      bookmakers: [],
      tags: [],
      betTypes: [],
      intestatari: [],
      stakeMin: null,
      stakeMax: null,
    });
  };

  const toggleArrayFilter = (key: 'bookmakers' | 'tags' | 'betTypes' | 'intestatari', value: string) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange({ ...filters, [key]: newValues });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per evento, conto, tag, note..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onFilterChange({ ...filters, search: '' })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Advanced Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtri
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {[filters.dateFrom, filters.dateTo, ...filters.bookmakers, ...filters.tags, ...filters.betTypes]
                    .filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filtri Avanzati</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Reset
                  </Button>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-xs">Periodo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        {filters.dateFrom ? filters.dateFrom.toLocaleDateString('it-IT') : 'Da...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom || undefined}
                        onSelect={(date) => onFilterChange({ ...filters, dateFrom: date || null })}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        {filters.dateTo ? filters.dateTo.toLocaleDateString('it-IT') : 'A...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo || undefined}
                        onSelect={(date) => onFilterChange({ ...filters, dateTo: date || null })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Bookmakers */}
              {availableBookmakers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Bookmaker</Label>
                  <div className="flex flex-wrap gap-1">
                    {availableBookmakers.map(bm => (
                      <Badge
                        key={bm}
                        variant={filters.bookmakers.includes(bm) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter('bookmakers', bm)}
                      >
                        {bm}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Tag</Label>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter('tags', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bet Types */}
              <div className="space-y-2">
                <Label className="text-xs">Tipo Scommessa</Label>
                <div className="flex flex-wrap gap-1">
                  {availableBetTypes.map(type => (
                    <Badge
                      key={type}
                      variant={filters.betTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayFilter('betTypes', type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stake Range */}
              <div className="space-y-2">
                <Label className="text-xs">Range Stake (€)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.stakeMin || ''}
                    onChange={(e) => onFilterChange({ ...filters, stakeMin: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.stakeMax || ''}
                    onChange={(e) => onFilterChange({ ...filters, stakeMax: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando <span className="font-semibold text-foreground">{resultCount}</span> di{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> risultati
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            Rimuovi filtri
          </Button>
        )}
      </div>
    </div>
  );
}

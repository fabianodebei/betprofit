import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw } from 'lucide-react';
import { SPORT_MARKETS } from '@/constants/markets';
import type { FilterState } from '@/types/oddsmatcher';

interface FiltersSectionProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch: () => void;
  loading: boolean;
  autoRefresh: boolean;
  onAutoRefreshToggle: () => void;
}

export function FiltersSection({
  filters,
  onFiltersChange,
  onSearch,
  loading,
  autoRefresh,
  onAutoRefreshToggle,
}: FiltersSectionProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleSportChange = (sport: string) => {
    const apiSport = sport === 'calcio' ? 'soccer' : sport === 'tennis' ? 'tennis' : 'basketball';
    const defaultMarkets = sport === 'calcio'
      ? ['1 Calcio', 'X Calcio', '2 Calcio']
      : sport === 'tennis'
      ? ['Tennis']
      : ['Basket'];

    setLocalFilters(prev => ({
      ...prev,
      sport: apiSport,
      markets: defaultMarkets,
    }));
  };

  const handleMarketToggle = (market: string, checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      markets: checked
        ? [...prev.markets, market]
        : prev.markets.filter(m => m !== market),
    }));
  };

  const handleExchangeToggle = (exchange: 'betfair' | 'betflag', checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      exchanges: {
        ...prev.exchanges,
        [exchange]: {
          ...prev.exchanges[exchange],
          enabled: checked,
        },
      },
    }));
  };

  const handleExchangeCommissionChange = (
    exchange: 'betfair' | 'betflag',
    commission: number
  ) => {
    setLocalFilters(prev => ({
      ...prev,
      exchanges: {
        ...prev.exchanges,
        [exchange]: {
          ...prev.exchanges[exchange],
          commission,
        },
      },
    }));
  };

  const handleSearch = () => {
    onFiltersChange(localFilters);
    onSearch();
  };

  const currentSport = localFilters.sport === 'soccer' ? 'calcio' : localFilters.sport === 'tennis' ? 'tennis' : 'basket';
  const availableMarkets = SPORT_MARKETS[currentSport as keyof typeof SPORT_MARKETS] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtri di Ricerca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sport Selection */}
        <div className="space-y-2">
          <Label>Sport</Label>
          <Tabs value={currentSport} onValueChange={handleSportChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calcio">⚽ Calcio</TabsTrigger>
              <TabsTrigger value="tennis">🎾 Tennis</TabsTrigger>
              <TabsTrigger value="basket">🏀 Basket</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Markets Selection */}
        <div className="space-y-2">
          <Label>Mercati</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableMarkets.slice(0, 12).map((market) => (
              <div key={market} className="flex items-center space-x-2">
                <Checkbox
                  id={market}
                  checked={localFilters.markets.includes(market)}
                  onCheckedChange={(checked) =>
                    handleMarketToggle(market, checked as boolean)
                  }
                />
                <label
                  htmlFor={market}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {market}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Minimum */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Rating Minimo</Label>
            <span className="text-sm font-medium">{localFilters.minRating}%</span>
          </div>
          <Slider
            value={[localFilters.minRating]}
            onValueChange={(value) =>
              setLocalFilters(prev => ({ ...prev, minRating: value[0] }))
            }
            min={70}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Exchanges */}
        <div className="space-y-4">
          <Label>Exchange</Label>

          {/* Betfair */}
          <div className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="betfair"
                  checked={localFilters.exchanges.betfair.enabled}
                  onCheckedChange={(checked) =>
                    handleExchangeToggle('betfair', checked as boolean)
                  }
                />
                <label htmlFor="betfair" className="text-sm font-medium cursor-pointer">
                  Betfair
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="betfair-commission" className="text-sm">
                  Commissione:
                </Label>
                <Input
                  id="betfair-commission"
                  type="number"
                  value={localFilters.exchanges.betfair.commission}
                  onChange={(e) =>
                    handleExchangeCommissionChange('betfair', parseFloat(e.target.value))
                  }
                  className="w-16"
                  step="0.1"
                  disabled={!localFilters.exchanges.betfair.enabled}
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>

          {/* Betflag */}
          <div className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="betflag"
                  checked={localFilters.exchanges.betflag.enabled}
                  onCheckedChange={(checked) =>
                    handleExchangeToggle('betflag', checked as boolean)
                  }
                />
                <label htmlFor="betflag" className="text-sm font-medium cursor-pointer">
                  Betflag
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="betflag-commission" className="text-sm">
                  Commissione:
                </Label>
                <Input
                  id="betflag-commission"
                  type="number"
                  value={localFilters.exchanges.betflag.commission}
                  onChange={(e) =>
                    handleExchangeCommissionChange('betflag', parseFloat(e.target.value))
                  }
                  className="w-16"
                  step="0.1"
                  disabled={!localFilters.exchanges.betflag.enabled}
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Periodo</Label>
          <Select
            value={localFilters.dateRange}
            onValueChange={(value) =>
              setLocalFilters(prev => ({ ...prev, dateRange: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Oggi</SelectItem>
              <SelectItem value="tomorrow">Domani</SelectItem>
              <SelectItem value="3days">Prossimi 3 giorni</SelectItem>
              <SelectItem value="7days">Prossimi 7 giorni</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={loading || localFilters.markets.length === 0}
            className="flex-1"
          >
            <Search className="mr-2 h-4 w-4" />
            Cerca Opportunità
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={onAutoRefreshToggle}
            size="icon"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Opportunity, FilterState, ExchangeSettings, OddsMatcherSettings } from '@/types/oddsmatcher';

interface OddsMatcherContextType {
  opportunities: Opportunity[];
  loading: boolean;
  filters: FilterState;
  exchangeSettings: ExchangeSettings;
  settings: OddsMatcherSettings | null;
  fetchOpportunities: (filters: FilterState) => Promise<void>;
  updateExchangeSettings: (exchange: 'betfair' | 'betflag', enabled: boolean, commission?: number) => void;
  clearOpportunities: () => void;
  saveSettings: (settings: Partial<OddsMatcherSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetFilters: () => void;
  filteredOpportunities: Opportunity[];
}

const defaultFilters: FilterState = {
  sport: 'soccer',
  markets: ['1 Calcio', 'X Calcio', '2 Calcio'],
  minRating: 0,
  exchanges: {
    betfair: { enabled: true, commission: 4.5 },
    betflag: { enabled: true, commission: 5.0 },
  },
  bookmakers: [],
  dateRange: 'today',
  betType: 'singola',
  stakePunta: 0,
  isFreeBet: false,
  bonus: 0,
  isRimborso: false,
  quotaMinima: 0,
  quotaMassima: 0,
  searchPartita: '',
  searchCampionato: 'tutti',
  dataInizio: null,
  dataFine: null,
};

const OddsMatcherContext = createContext<OddsMatcherContextType | undefined>(undefined);

export const useOddsMatcher = () => {
  const context = useContext(OddsMatcherContext);
  if (!context) {
    throw new Error('useOddsMatcher must be used within an OddsMatcherProvider');
  }
  return context;
};

export const OddsMatcherProvider = ({ children }: { children: ReactNode }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [exchangeSettings, setExchangeSettings] = useState<ExchangeSettings>(defaultFilters.exchanges);
  const [settings, setSettings] = useState<OddsMatcherSettings | null>(null);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const { toast } = useToast();

  // Apply client-side filters
  useEffect(() => {
    let filtered = [...opportunities];

    // Filter by quota range
    if (filters.quotaMinima > 0) {
      filtered = filtered.filter(opp => opp.quotaPunta >= filters.quotaMinima);
    }
    if (filters.quotaMassima > 0) {
      filtered = filtered.filter(opp => opp.quotaPunta <= filters.quotaMassima);
    }

    // Filter by partita search
    if (filters.searchPartita.trim()) {
      const search = filters.searchPartita.toLowerCase();
      filtered = filtered.filter(opp => 
        opp.eventName.toLowerCase().includes(search)
      );
    }

    // Filter by campionato
    if (filters.searchCampionato && filters.searchCampionato !== 'tutti') {
      filtered = filtered.filter(opp => opp.competition === filters.searchCampionato);
    }

    // Filter by date range
    if (filters.dataInizio) {
      filtered = filtered.filter(opp => new Date(opp.eventDate) >= filters.dataInizio!);
    }
    if (filters.dataFine) {
      const endOfDay = new Date(filters.dataFine);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(opp => new Date(opp.eventDate) <= endOfDay);
    }

    setFilteredOpportunities(filtered);
  }, [opportunities, filters]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_oddsmatcher_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setExchangeSettings({
          betfair: {
            enabled: data.betfair_enabled,
            commission: data.betfair_commission,
          },
          betflag: {
            enabled: data.betflag_enabled,
            commission: data.betflag_commission,
          },
        });
        setFilters(prev => ({
          ...prev,
          minRating: data.min_rating,
          exchanges: {
            betfair: {
              enabled: data.betfair_enabled,
              commission: data.betfair_commission,
            },
            betflag: {
              enabled: data.betflag_enabled,
              commission: data.betflag_commission,
            },
          },
        }));
      }
    } catch (error) {
      console.error('Error loading oddsmatcher settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<OddsMatcherSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_oddsmatcher_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
        });

      if (error) throw error;

      await loadSettings();
      toast({
        title: 'Impostazioni salvate',
        description: 'Le impostazioni Oddsmatcher sono state aggiornate.',
      });
    } catch (error) {
      console.error('Error saving oddsmatcher settings:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare le impostazioni.',
        variant: 'destructive',
      });
    }
  };

  const fetchOpportunities = async (searchFilters: FilterState) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-odds', {
        body: {
          sport: searchFilters.sport,
          markets: searchFilters.markets,
          minRating: searchFilters.minRating,
          exchanges: searchFilters.exchanges,
          dateRange: searchFilters.dateRange,
        },
      });

      if (error) throw error;

      setOpportunities(data.opportunities || []);
      setFilters(searchFilters);

      // Save found opportunities to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data.opportunities?.length > 0) {
        const historyRecords = data.opportunities.map((opp: Opportunity) => ({
          user_id: user.id,
          sport: opp.sport,
          event_name: opp.eventName,
          event_date: opp.eventDate,
          competition: opp.competition,
          market: opp.market,
          bookmaker: opp.bookmaker,
          quota_punta: opp.quotaPunta,
          exchange: opp.exchange,
          quota_banca: opp.quotaBanca,
          rating: opp.rating,
          profit_estimate: opp.profitEstimate,
          commission: opp.commission,
          status: 'found',
        }));

        await supabase.from('oddsmatcher_history').insert(historyRecords);
      }

      toast({
        title: 'Opportunità trovate',
        description: `Trovate ${data.opportunities?.length || 0} opportunità con rating >= ${searchFilters.minRating}%`,
      });
    } catch (error: any) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile recuperare le opportunità.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExchangeSettings = (
    exchange: 'betfair' | 'betflag',
    enabled: boolean,
    commission?: number
  ) => {
    setExchangeSettings(prev => ({
      ...prev,
      [exchange]: {
        enabled,
        commission: commission ?? prev[exchange].commission,
      },
    }));
  };

  const clearOpportunities = () => {
    setOpportunities([]);
    setFilteredOpportunities([]);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setExchangeSettings(defaultFilters.exchanges);
  };

  return (
    <OddsMatcherContext.Provider
      value={{
        opportunities,
        loading,
        filters,
        exchangeSettings,
        settings,
        fetchOpportunities,
        updateExchangeSettings,
        clearOpportunities,
        saveSettings,
        loadSettings,
        resetFilters,
        filteredOpportunities,
      }}
    >
      {children}
    </OddsMatcherContext.Provider>
  );
};

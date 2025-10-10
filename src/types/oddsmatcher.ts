export type BetType = 'singola' | 'multipla' | 'tre_vie' | 'best_odds' | 'best_opposite' | 'sure_bet';

export interface Opportunity {
  id: string;
  sport: string;
  eventName: string;
  eventDate: string;
  competition: string;
  market: string;
  selection: string;
  bookmaker: string;
  quotaPunta: number;
  exchange: string;
  quotaBanca: number;
  rating: number;
  profitEstimate: number;
  commission: number;
  suggestedStake: number;
  liability: number;
}

export interface ExchangeSettings {
  betfair: {
    enabled: boolean;
    commission: number;
  };
  betflag: {
    enabled: boolean;
    commission: number;
  };
}

export interface FilterState {
  sport: string;
  markets: string[];
  minRating: number;
  exchanges: ExchangeSettings;
  bookmakers: string[];
  dateRange: string;
  betType: BetType;
  stakePunta: number;
  isFreeBet: boolean;
  bonus: number;
  isRimborso: boolean;
  quotaMinima: number;
  quotaMassima: number;
  searchPartita: string;
  searchCampionato: string;
  dataInizio: Date | null;
  dataFine: Date | null;
}

export interface OddsMatcherSettings {
  betfair_commission: number;
  betfair_enabled: boolean;
  betflag_commission: number;
  betflag_enabled: boolean;
  min_rating: number;
  auto_refresh_minutes: number;
  default_stake: number;
}

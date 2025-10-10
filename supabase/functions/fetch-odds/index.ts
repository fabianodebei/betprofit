import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY');
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

interface FetchOddsRequest {
  sport: string;
  markets: string[];
  minRating: number;
  dateRange?: string;
  exchanges: { betfair: { enabled: boolean; commission: number }; betflag: { enabled: boolean; commission: number } };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { sport, markets, minRating, exchanges }: FetchOddsRequest = await req.json();

    console.log(`Fetching odds for sport: ${sport}, markets: ${markets.join(',')}, minRating: ${minRating}`);

    // Map internal markets to The Odds API markets
    const apiMarkets = mapMarketsToAPI(markets);
    
    // Fetch odds from The Odds API
    const oddsUrl = `${ODDS_API_BASE}/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=${apiMarkets.join(',')}&oddsFormat=decimal&dateFormat=iso`;
    
    console.log(`Calling Odds API: ${oddsUrl.replace(ODDS_API_KEY!, 'HIDDEN')}`);
    
    const oddsResponse = await fetch(oddsUrl);
    
    if (!oddsResponse.ok) {
      const errorText = await oddsResponse.text();
      console.error(`Odds API error: ${oddsResponse.status} - ${errorText}`);
      throw new Error(`Odds API error: ${oddsResponse.status}`);
    }

    const oddsData = await oddsResponse.json();
    console.log(`Received ${oddsData.length} events from Odds API`);

    // Process odds and find opportunities
    const opportunities = [];
    
    for (const event of oddsData) {
      const eventName = `${event.home_team} vs ${event.away_team}`;
      const eventDate = event.commence_time;
      const competition = event.sport_title || sport;

      // Get bookmaker odds
      const bookmakerOdds = event.bookmakers || [];
      
      for (const bookmaker of bookmakerOdds) {
        // Skip if bookmaker is an exchange
        if (isExchange(bookmaker.key)) continue;

        for (const market of bookmaker.markets || []) {
          const internalMarket = mapAPIMarketToInternal(market.key, sport);
          if (!markets.includes(internalMarket)) continue;

          for (const outcome of market.outcomes || []) {
            const quotaPunta = outcome.price;
            
            // Find matching exchange odds
            for (const exchangeBookmaker of bookmakerOdds) {
              if (!isExchange(exchangeBookmaker.key)) continue;
              
              const exchangeName = mapExchangeName(exchangeBookmaker.key);
              const exchangeConfig = exchangeName === 'Betfair' ? exchanges.betfair : exchanges.betflag;
              
              if (!exchangeConfig.enabled) continue;

              for (const exchangeMarket of exchangeBookmaker.markets || []) {
                if (exchangeMarket.key !== market.key) continue;

                // Find matching outcome (for lay)
                const layOutcome = exchangeMarket.outcomes.find((o: any) => o.name === outcome.name);
                if (!layOutcome) continue;

                const quotaBanca = layOutcome.price;
                const commission = exchangeConfig.commission;

                // Calculate rating
                const rating = calculateRating(quotaPunta, quotaBanca, commission);
                
                if (rating >= minRating) {
                  // Calculate estimated profit (assuming default stake of 100€)
                  const defaultStake = 100;
                  const profitEstimate = calculateGuaranteedProfit(
                    defaultStake,
                    quotaPunta,
                    quotaBanca,
                    commission
                  );

                  opportunities.push({
                    id: crypto.randomUUID(),
                    sport,
                    eventName,
                    eventDate,
                    competition,
                    market: internalMarket,
                    selection: outcome.name,
                    bookmaker: mapBookmakerName(bookmaker.key),
                    quotaPunta,
                    exchange: exchangeName,
                    quotaBanca,
                    rating: parseFloat(rating.toFixed(2)),
                    profitEstimate: parseFloat(profitEstimate.toFixed(2)),
                    commission,
                    suggestedStake: defaultStake,
                    liability: parseFloat((defaultStake * (quotaBanca - 1)).toFixed(2))
                  });

                  console.log(`Found opportunity: ${eventName} - ${internalMarket} - Rating: ${rating.toFixed(2)}%`);
                }
              }
            }
          }
        }
      }
    }

    // Sort by rating descending
    opportunities.sort((a, b) => b.rating - a.rating);

    console.log(`Returning ${opportunities.length} opportunities`);

    return new Response(
      JSON.stringify({ opportunities }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in fetch-odds function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function mapMarketsToAPI(markets: string[]): string[] {
  const mapping: Record<string, string> = {
    '1 Calcio': 'h2h',
    'X Calcio': 'h2h',
    '2 Calcio': 'h2h',
    'Goal Calcio': 'btts',
    'No Goal Calcio': 'btts',
    'Over 0.5 Calcio': 'totals',
    'Over 1.5 Calcio': 'totals',
    'Over 2.5 Calcio': 'totals',
    'Over 3.5 Calcio': 'totals',
    'Over 4.5 Calcio': 'totals',
    'Under 0.5 Calcio': 'totals',
    'Under 1.5 Calcio': 'totals',
    'Under 2.5 Calcio': 'totals',
    'Under 3.5 Calcio': 'totals',
    'Under 4.5 Calcio': 'totals',
  };

  const apiMarkets = new Set<string>();
  for (const market of markets) {
    const apiMarket = mapping[market];
    if (apiMarket) apiMarkets.add(apiMarket);
  }

  return Array.from(apiMarkets);
}

function mapAPIMarketToInternal(apiMarket: string, sport: string): string {
  const suffix = sport === 'soccer' ? ' Calcio' : sport === 'tennis' ? ' Tennis' : ' Basket';
  
  if (apiMarket === 'h2h') return '1' + suffix;
  if (apiMarket === 'btts') return 'Goal' + suffix;
  if (apiMarket === 'totals') return 'Over 2.5' + suffix;
  
  return 'Altro' + suffix;
}

function isExchange(bookmakerKey: string): boolean {
  return bookmakerKey.includes('betfair') || bookmakerKey.includes('matchbook');
}

function mapExchangeName(exchangeKey: string): string {
  if (exchangeKey.includes('betfair')) return 'Betfair';
  if (exchangeKey.includes('matchbook')) return 'Betflag';
  return exchangeKey;
}

function mapBookmakerName(bookmakerKey: string): string {
  const mapping: Record<string, string> = {
    'bet365': 'Bet365',
    'williamhill': 'William Hill',
    'unibet': 'Unibet',
    '888sport': '888sport',
    'betway': 'Betway',
    'skybet': 'SkyBet',
    'ladbrokes': 'Ladbrokes',
  };
  return mapping[bookmakerKey] || bookmakerKey;
}

function calculateRating(quotaPunta: number, quotaBanca: number, commission: number): number {
  return ((quotaPunta / quotaBanca) - 1) * 100 - commission;
}

function calculateGuaranteedProfit(
  stakePunta: number,
  quotaPunta: number,
  quotaBanca: number,
  commission: number
): number {
  const stakeBanca = (stakePunta * quotaPunta) / quotaBanca;
  const liability = stakeBanca * (quotaBanca - 1);
  
  // Scenario 1: Bookmaker bet wins
  const winScenario = (stakePunta * (quotaPunta - 1)) - liability;
  
  // Scenario 2: Exchange bet wins (with commission)
  const exchangeProfit = stakeBanca * (1 - commission / 100);
  const loseScenario = exchangeProfit - stakePunta;
  
  return Math.min(winScenario, loseScenario);
}

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
    
    // Log available bookmakers
    if (oddsData.length > 0 && oddsData[0].bookmakers) {
      const availableBookmakers = oddsData[0].bookmakers.map((b: any) => b.key).join(', ');
      console.log(`Available bookmakers: ${availableBookmakers}`);
    }

    // Define Italian bookmakers to filter
    const italianBookmakers = [
      'snai', 'sisal', 'goldbet', 'betflag', 'lottomatica', 
      'eurobet', 'planetwin365', 'admiral', 'netbet', 'betsson', 
      'better', 'bet365', 'williamhill', 'unibet'
    ];

    // Process odds and find opportunities
    const opportunities = [];
    
    for (const event of oddsData) {
      const eventName = `${event.home_team} vs ${event.away_team}`;
      const eventDate = event.commence_time;
      const competition = event.sport_title || sport;

      const bookmakerOdds = event.bookmakers || [];
      
      // Filter only Italian bookmakers and exclude exchanges
      const italianBookmakerOdds = bookmakerOdds.filter((bm: any) => 
        !isExchange(bm.key) && italianBookmakers.some(italian => bm.key.toLowerCase().includes(italian))
      );
      
      console.log(`Event: ${eventName}, Italian bookmakers found: ${italianBookmakerOdds.map((b: any) => b.key).join(', ')}`);
      
      // Look for surebet opportunities between different Italian bookmakers
      for (let i = 0; i < italianBookmakerOdds.length; i++) {
        const bookmaker1 = italianBookmakerOdds[i];

        for (const market1 of bookmaker1.markets || []) {
          const internalMarket = mapAPIMarketToInternal(market1.key, sport);
          if (!markets.includes(internalMarket)) continue;

          for (const outcome1 of market1.outcomes || []) {
            const quotaPunta = outcome1.price;
            
            // Check against other Italian bookmakers for opposite outcomes (surebet)
            for (let j = 0; j < italianBookmakerOdds.length; j++) {
              if (i === j) continue; // Skip same bookmaker
              
              const bookmaker2 = italianBookmakerOdds[j];
              
              for (const market2 of bookmaker2.markets || []) {
                if (market2.key !== market1.key) continue;

                // For h2h markets, find opposite outcomes
                if (market1.key === 'h2h') {
                  // Find different team/outcome
                  for (const outcome2 of market2.outcomes || []) {
                    if (outcome1.name === outcome2.name) continue;
                    
                    const quota2 = outcome2.price;
                    
                    // Calculate surebet rating
                    const inverse1 = 1 / quotaPunta;
                    const inverse2 = 1 / quota2;
                    const totalInverse = inverse1 + inverse2;
                    
                    // Check if there's a third outcome (X)
                    const outcome3 = market2.outcomes.find((o: any) => 
                      o.name !== outcome1.name && o.name !== outcome2.name
                    );
                    
                    // Calculate surebet rating
                    let rating = 0;
                    
                    if (outcome3) {
                      // 3-way market (1X2)
                      const inverse3 = 1 / outcome3.price;
                      const totalInverse3 = inverse1 + inverse2 + inverse3;
                      rating = (1 - totalInverse3) * 100;
                    } else {
                      // 2-way market
                      rating = (1 - totalInverse) * 100;
                    }
                    
                    // Find all opportunities regardless of rating
                    if (true) {
                      const defaultStake = 100;
                      const profitEstimate = (defaultStake / totalInverse) - defaultStake;

                      opportunities.push({
                        id: crypto.randomUUID(),
                        sport,
                        eventName,
                        eventDate,
                        competition,
                        market: internalMarket,
                        selection: outcome1.name,
                        bookmaker: mapBookmakerName(bookmaker1.key),
                        quotaPunta,
                        exchange: mapBookmakerName(bookmaker2.key),
                        quotaBanca: quota2,
                        rating: parseFloat(rating.toFixed(2)),
                        profitEstimate: parseFloat(profitEstimate.toFixed(2)),
                        commission: 0,
                        suggestedStake: defaultStake,
                        liability: parseFloat((defaultStake * (quota2 - 1)).toFixed(2))
                      });

                      console.log(`Found surebet: ${eventName} - ${outcome1.name} vs ${outcome2.name} - ${mapBookmakerName(bookmaker1.key)} vs ${mapBookmakerName(bookmaker2.key)} - Rating: ${rating.toFixed(2)}%`);
                    }
                  }
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

  // If no markets mapped, use h2h as default
  if (apiMarkets.size === 0) {
    apiMarkets.add('h2h');
  }

  return Array.from(apiMarkets);
}

function mapAPIMarketToInternal(apiMarket: string, sport: string): string {
  const suffix = sport === 'soccer' ? ' Calcio' : sport === 'tennis' ? ' Tennis' : ' Basket';
  
  if (apiMarket === 'h2h') return '1' + suffix;
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
    'snai': 'SNAI',
    'sisal': 'Sisal',
    'goldbet': 'Goldbet',
    'betflag': 'Betflag',
    'lottomatica': 'Lottomatica',
    'eurobet': 'Eurobet',
    'planetwin365': 'Planetwin365',
    'admiral': 'Admiral',
    'netbet': 'NetBet',
    'betsson': 'Betsson',
    'better': 'Better',
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

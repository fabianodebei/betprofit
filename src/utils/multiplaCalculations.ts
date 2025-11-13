import { Bet, BetLeg } from '@/types';

export interface LayBet {
  id: string;
  stake: number;
  quotaBanca: number;
  quotaPunta: number;
  tassePercentuale: number;
  attiva: boolean;
  evento: string;
}

export interface MultiplaCalculations {
  totalRisk: number;
  scenarioVincita: number;
  scenarioPerditaBest: number;
  scenarioPerditaWorst: number;
  guadagnoTotale: number;
  perGamba: Array<{
    id: string;
    evento: string;
    risultato: number;
  }>;
}

export function getMultiplaCalculations(
  bet: Bet | null,
  layBets: LayBet[],
  betLegs?: BetLeg[]
): MultiplaCalculations {
  if (!bet) {
    return {
      totalRisk: 0,
      scenarioVincita: 0,
      scenarioPerditaBest: 0,
      scenarioPerditaWorst: 0,
      guadagnoTotale: 0,
      perGamba: [],
    };
  }

  // Filtra solo le bancate attive
  const activeBets = layBets.filter(lb => lb.attiva);

  // Calcola la liability per ogni lay bet (responsabilità se la bancata perde)
  const liability = (lb: LayBet) => lb.stake * (lb.quotaBanca - 1);

  // Calcola la vincita netta del lay (vincita - tasse)
  // La vincita lorda è lo stake bancato, le tasse si applicano solo sul profitto
  const layWinNet = (lb: LayBet) => {
    const profitLordo = lb.stake;
    const tasse = profitLordo * ((lb.tassePercentuale || 0) / 100);
    return profitLordo - tasse;
  };

  // Somma di tutte le liability delle bancate attive
  const sumLiability = activeBets.reduce((sum, lb) => sum + liability(lb), 0);

  // Quota effettiva della multipla: usa quotaCombinata se presente, altrimenti calcola dal prodotto delle quote delle gambe, fallback 1
  const quotaEffettiva =
    (bet.quotaCombinata && bet.quotaCombinata > 0)
      ? bet.quotaCombinata
      : (bet.quota && bet.quota > 0)
        ? bet.quota
        : (betLegs && betLegs.length > 0
            ? betLegs.reduce((prod, leg) => prod * (Number(leg.quota) || 1), 1)
            : 1);

  // Scenario: multipla VINTA
  // Guadagno dalla puntata - tutte le liability perse
  let puntaWin: number;
  if (bet.tipoBonus === 'Free Bet') {
    // Free Bet: vincita = stake * (quotaEffettiva - 1) (guadagno netto senza puntata iniziale)
    puntaWin = bet.stake * (quotaEffettiva - 1);
  } else if (bet.tipoBonus === 'Bonus' && bet.bonus) {
    // Bonus: vincita = (stake + bonus) * quotaEffettiva - stake
    puntaWin = (bet.stake + bet.bonus) * quotaEffettiva - bet.stake;
  } else {
    // Normale: solo profitto netto (stake torna al conto ma non è vincita)
    puntaWin = bet.stake * quotaEffettiva - bet.stake;
  }

  // Scenario: multipla PERSA
  // Perdi lo stake (meno eventuale rimborso), ma con Free Bet la perdita è 0
  let puntaLoss: number;
  if (bet.tipoBonus === 'Free Bet') {
    puntaLoss = 0;
  } else {
    puntaLoss = -(bet.stake - (bet.rimborso || 0));
  }

  // Scenario vincita multipla = vincita punta - tutte le liability
  const scenarioVincita = puntaWin - sumLiability;

  // Scenario per ogni gamba attiva (multipla perde su quella specifica lay)
  // TUTTE LE BANCATE SONO PIAZZATE CONTEMPORANEAMENTE
  const perGamba = activeBets.map((lb) => {
    // Se questa gamba fa vincere il lay (multipla perde su questa gamba):
    // 1. Perdi la puntata della multipla: puntaLoss
    // 2. Vinci il lay specifico: +layWinNet(lb)
    // 3. Perdi TUTTE le altre bancate (non solo quelle precedenti)
    const altreLiability = activeBets
      .filter((other) => other.id !== lb.id) // Escludi solo la bancata corrente
      .reduce((sum, other) => sum + liability(other), 0);
    
    const risultato = puntaLoss + layWinNet(lb) - altreLiability;
    return {
      id: lb.id,
      evento: lb.evento,
      risultato,
    };
  });

  // Migliore e peggiore scenario di perdita
  const scenarioPerditaBest = perGamba.length 
    ? Math.max(...perGamba.map((x) => x.risultato)) 
    : puntaLoss;
  const scenarioPerditaWorst = perGamba.length 
    ? Math.min(...perGamba.map((x) => x.risultato)) 
    : puntaLoss;

  // Rischio totale = somma di tutte le liability
  const totalRisk = sumLiability;

  // Guadagno totale = scenario peggiore tra vincita e perdita worst
  const guadagnoTotale = Math.min(scenarioVincita, scenarioPerditaWorst);

  return {
    totalRisk,
    scenarioVincita,
    scenarioPerditaBest,
    scenarioPerditaWorst,
    guadagnoTotale,
    perGamba,
  };
}

import { Bet, BetLeg } from '@/types';

export interface LayBet {
  id: string;
  stake: number;
  quotaBanca: number;
  quotaPunta: number;
  tassePercentuale: number;
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

  // Calcola la liability per ogni lay bet (responsabilità se la bancata perde)
  const liability = (lb: LayBet) => lb.stake * (lb.quotaBanca - 1);

  // Calcola la vincita netta del lay (vincita - tasse)
  const layWinNet = (lb: LayBet) => lb.stake * (1 - (lb.tassePercentuale || 0) / 100);

  // Somma di tutte le liability
  const sumLiability = layBets.reduce((sum, lb) => sum + liability(lb), 0);

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
  const puntaWin = bet.stake * (quotaEffettiva - 1) + (bet.bonus || 0);

  // Scenario: multipla PERSA
  // Perdi lo stake (meno eventuale rimborso)
  const puntaLoss = -(bet.stake - (bet.rimborso || 0));

  // Scenario vincita multipla = vincita punta - tutte le liability
  const scenarioVincita = puntaWin - sumLiability;

  // Scenario per ogni gamba (multipla perde su quella specifica lay)
  const perGamba = layBets.map((lb) => {
    // Perdi la puntata + vinci quella specifica lay - (tutte le altre liability)
    const risultato = puntaLoss + layWinNet(lb) - (sumLiability - liability(lb));
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

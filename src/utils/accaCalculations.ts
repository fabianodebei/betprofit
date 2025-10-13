// Utility per calcoli matched betting su scommesse multiple (acca)

export interface LayStakeSuggestion {
  stake1: number;
  stake2: number;
  liability1: number;
  liability2: number;
  scenarioWin: number;
  scenarioLossLeg1: number;
  scenarioLossLeg2: number;
  imbalance: number;
}

export interface SequentialStakeResult {
  layStake: number;
  liability: number;
  expectedLoss: number;
}

/**
 * Calcola gli stake lay bilanciati per una multipla a 2 gambe (pre-match)
 * Obiettivo: minimizzare la perdita massima bilanciando i due scenari di perdita
 */
export function computeBalancedLayStakes2Legs(params: {
  stakeMultipla: number;
  quotaMultipla: number;
  quotaLay1: number;
  quotaLay2: number;
  commission1: number; // in decimale (es. 0.045 per 4.5%)
  commission2: number;
  targetLoss?: number; // perdita target (opzionale)
}): LayStakeSuggestion {
  const { stakeMultipla, quotaMultipla, quotaLay1, quotaLay2, commission1, commission2, targetLoss } = params;

  // Fattori di commissione
  const k1 = 1 - commission1;
  const k2 = 1 - commission2;

  // Calcolo proporzione per bilanciare le perdite
  // Formula: stake1 / stake2 = (k2 * (quotaLay2 - 1)) / (k1 * (quotaLay1 - 1))
  const ratio = (k2 * (quotaLay2 - 1)) / (k1 * (quotaLay1 - 1));

  let stake1: number;
  let stake2: number;

  if (targetLoss !== undefined) {
    // Se c'è una perdita target, risolvi algebricamente
    // Scenario perdita se perde gamba 1: -stakeMultipla + (stake1 * k1) - (stake2 * (quotaLay2 - 1))
    // Scenario perdita se perde gamba 2: -stakeMultipla + (stake2 * k2) - (stake1 * (quotaLay1 - 1))
    // Impostiamo entrambi = targetLoss e risolviamo
    
    // Dalla prima: stake1 * k1 - stake2 * (quotaLay2 - 1) = targetLoss + stakeMultipla
    // Dalla seconda: stake2 * k2 - stake1 * (quotaLay1 - 1) = targetLoss + stakeMultipla
    // Con stake1 = ratio * stake2:
    // ratio * stake2 * k1 - stake2 * (quotaLay2 - 1) = targetLoss + stakeMultipla
    // stake2 * [ratio * k1 - (quotaLay2 - 1)] = targetLoss + stakeMultipla
    
    const denominator = ratio * k1 - (quotaLay2 - 1);
    if (Math.abs(denominator) < 0.0001) {
      // Caso degenere, usa una proporzione semplice
      stake2 = stakeMultipla * 0.5;
      stake1 = ratio * stake2;
    } else {
      stake2 = (targetLoss + stakeMultipla) / denominator;
      stake1 = ratio * stake2;
    }
  } else {
    // Senza target, bilanciamo usando una strategia che minimizza la perdita massima
    // Partiamo da una base ragionevole (es. stake multipla) e scaliamo
    const baseStake = stakeMultipla * quotaMultipla * 0.3; // euristica
    stake2 = baseStake;
    stake1 = ratio * stake2;
  }

  // Assicuriamoci che gli stake siano positivi
  stake1 = Math.max(0, stake1);
  stake2 = Math.max(0, stake2);

  // Calcola liability (responsabilità se la bancata perde)
  const liability1 = stake1 * (quotaLay1 - 1);
  const liability2 = stake2 * (quotaLay2 - 1);

  // Calcola i tre scenari
  const vinciMultipla = stakeMultipla * (quotaMultipla - 1);
  
  // Scenario multipla vinta: vinci la punta, perdi entrambe le lay
  const scenarioWin = vinciMultipla - liability1 - liability2;

  // Scenario gamba 1 perde: perdi la punta, vinci lay1, perdi lay2
  const scenarioLossLeg1 = -stakeMultipla + (stake1 * k1) - liability2;

  // Scenario gamba 2 perde: perdi la punta, vinci lay2, perdi lay1
  const scenarioLossLeg2 = -stakeMultipla + (stake2 * k2) - liability1;

  // Sbilanciamento tra i due scenari di perdita
  const imbalance = Math.abs(scenarioLossLeg1 - scenarioLossLeg2);

  return {
    stake1: Math.round(stake1 * 100) / 100,
    stake2: Math.round(stake2 * 100) / 100,
    liability1: Math.round(liability1 * 100) / 100,
    liability2: Math.round(liability2 * 100) / 100,
    scenarioWin: Math.round(scenarioWin * 100) / 100,
    scenarioLossLeg1: Math.round(scenarioLossLeg1 * 100) / 100,
    scenarioLossLeg2: Math.round(scenarioLossLeg2 * 100) / 100,
    imbalance: Math.round(imbalance * 100) / 100,
  };
}

/**
 * Calcola lo stake lay per modalità sequenziale (prima gamba)
 * Obiettivo: ottenere una perdita target se la prima gamba perde
 */
export function computeSequentialStake1(params: {
  stakeMultipla: number;
  quotaLay1: number;
  commission1: number;
  targetLoss: number;
}): SequentialStakeResult {
  const { stakeMultipla, quotaLay1, commission1, targetLoss } = params;
  const k1 = 1 - commission1;

  // Se perde gamba 1: -stakeMultipla + (layStake1 * k1) = targetLoss
  // layStake1 = (targetLoss + stakeMultipla) / k1
  const layStake = (targetLoss + stakeMultipla) / k1;
  const liability = layStake * (quotaLay1 - 1);

  return {
    layStake: Math.round(layStake * 100) / 100,
    liability: Math.round(liability * 100) / 100,
    expectedLoss: targetLoss,
  };
}

/**
 * Calcola lo stake lay per modalità sequenziale (seconda gamba, dopo che la prima è vinta)
 * Obiettivo: ottenere una perdita target se la seconda gamba perde
 */
export function computeSequentialStake2(params: {
  stakeMultipla: number;
  quotaMultipla: number;
  quotaLay2: number;
  commission2: number;
  resultLay1: number; // risultato della prima lay (negativo se hai perso liability)
  targetLoss: number;
}): SequentialStakeResult {
  const { stakeMultipla, quotaMultipla, quotaLay2, commission2, resultLay1, targetLoss } = params;
  const k2 = 1 - commission2;

  // Situazione: la gamba 1 è vinta (multipla ancora viva)
  // Se perde gamba 2: -stakeMultipla + (layStake2 * k2) + resultLay1 = targetLoss
  // layStake2 = (targetLoss + stakeMultipla - resultLay1) / k2
  const layStake = (targetLoss + stakeMultipla - resultLay1) / k2;
  const liability = layStake * (quotaLay2 - 1);

  return {
    layStake: Math.round(layStake * 100) / 100,
    liability: Math.round(liability * 100) / 100,
    expectedLoss: targetLoss,
  };
}

/**
 * Verifica se un mercato lay è probabilmente incompatibile con la selezione back
 */
export function checkMarketCompatibility(backSelection: string, layMarket: string): { compatible: boolean; warning?: string } {
  const normalizedSelection = backSelection.toLowerCase().trim();
  const normalizedMarket = layMarket.toLowerCase().trim();

  // Se la selezione back è "1" (casa) e il mercato lay contiene "1x" o "x2", è incompatibile
  if (normalizedSelection === '1' || normalizedSelection === 'casa' || normalizedSelection === 'home') {
    if (normalizedMarket.includes('1x') || normalizedMarket.includes('x2')) {
      return {
        compatible: false,
        warning: "Il mercato 1X o X2 non copre completamente la selezione '1'. Usa 'Lay 1' o 'Esito Finale - 1'.",
      };
    }
  }

  // Se la selezione back è "2" (trasferta) e il mercato lay contiene "1x" o "x2", è incompatibile
  if (normalizedSelection === '2' || normalizedSelection === 'trasferta' || normalizedSelection === 'away') {
    if (normalizedMarket.includes('1x') || normalizedMarket.includes('x2')) {
      return {
        compatible: false,
        warning: "Il mercato 1X o X2 non copre completamente la selezione '2'. Usa 'Lay 2' o 'Esito Finale - 2'.",
      };
    }
  }

  // Se la selezione back è "X" (pareggio) e il mercato lay contiene "1x" o "x2", è incompatibile
  if (normalizedSelection === 'x' || normalizedSelection === 'pareggio' || normalizedSelection === 'draw') {
    if (normalizedMarket.includes('1x') || normalizedMarket.includes('x2')) {
      return {
        compatible: false,
        warning: "Il mercato 1X o X2 non copre completamente la selezione 'X'. Usa 'Lay X' o 'Esito Finale - X'.",
      };
    }
  }

  return { compatible: true };
}

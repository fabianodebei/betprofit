/**
 * Calcola il rating matched betting
 * Formula: ((quotaPunta / quotaBanca) - 1) × 100 - commission
 */
export function calculateRating(
  quotaPunta: number,
  quotaBanca: number,
  commission: number
): number {
  return ((quotaPunta / quotaBanca) - 1) * 100 - commission;
}

/**
 * Calcola la responsabilità exchange (liability)
 * Formula: stake × (quotaBanca - 1)
 */
export function calculateLiability(stake: number, quotaBanca: number): number {
  return stake * (quotaBanca - 1);
}

/**
 * Calcola il profitto garantito considerando le commissioni
 */
export function calculateGuaranteedProfit(
  stakePunta: number,
  quotaPunta: number,
  quotaBanca: number,
  commission: number
): { winProfit: number; loseProfit: number; guaranteed: number } {
  const stakeBanca = calculateOptimalLayStake(stakePunta, quotaPunta, quotaBanca, commission);
  const liability = calculateLiability(stakeBanca, quotaBanca);

  // Scenario 1: La puntata bookmaker vince
  const winProfit = stakePunta * (quotaPunta - 1) - liability;

  // Scenario 2: La bancata exchange vince (con commissione)
  const exchangeProfit = stakeBanca * (1 - commission / 100);
  const loseProfit = exchangeProfit - stakePunta;

  const guaranteed = Math.min(winProfit, loseProfit);

  return {
    winProfit: parseFloat(winProfit.toFixed(2)),
    loseProfit: parseFloat(loseProfit.toFixed(2)),
    guaranteed: parseFloat(guaranteed.toFixed(2)),
  };
}

/**
 * Suggerisce lo stake bancata ottimale per profit massimo
 * Formula: (stakePunta × quotaPunta) / quotaBanca
 */
export function calculateOptimalLayStake(
  stakePunta: number,
  quotaPunta: number,
  quotaBanca: number,
  commission: number
): number {
  const optimalStake = (stakePunta * quotaPunta) / quotaBanca;
  return parseFloat(optimalStake.toFixed(2));
}

/**
 * Calcola la commissione dal profitto
 */
export function calculateCommission(profit: number, commissionRate: number): number {
  return parseFloat((profit * (commissionRate / 100)).toFixed(2));
}

/**
 * Calcola la vincita potenziale da una puntata bookmaker
 */
export function calculatePotentialWin(stake: number, quota: number): number {
  return parseFloat((stake * quota).toFixed(2));
}

/**
 * Verifica se un'opportunità è valida (rating positivo)
 */
export function isValidOpportunity(
  quotaPunta: number,
  quotaBanca: number,
  commission: number,
  minRating: number = 75
): boolean {
  const rating = calculateRating(quotaPunta, quotaBanca, commission);
  return rating >= minRating;
}

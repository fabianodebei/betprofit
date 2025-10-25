import { Bet } from '@/types';

/**
 * Helper functions for bet balance calculations
 * Extracted from BetContext to improve maintainability
 */

interface Account {
  id: string;
  saldo_attuale: number;
  bilancio_giocate: number;
  bilancio_giocate_rapide: number;
  [key: string]: any;
}

/**
 * Check if a bet is Free Bet or Bonus type
 */
export const isFreeOrBonus = (bet: Bet): boolean => {
  return bet.tipoBonus === 'Free Bet' || bet.tipoBonus === 'Bonus';
};

/**
 * Calculate stake to restore when deleting a bet
 * Returns 0 for Free/Bonus bets, otherwise returns the stake
 */
export const calculateStakeRestoration = (bet: Bet): number => {
  if (isFreeOrBonus(bet)) return 0;
  return Number(bet.stake) || 0;
};

/**
 * Calculate balance adjustment when deleting an archived bet
 * @param bet - The bet being deleted
 * @returns Object with balance adjustments for regular and quick bets
 */
export const calculateArchivedBetDeletion = (bet: Bet): {
  bilancioAdjustment: number;
  bilancioRapideAdjustment: number;
} => {
  const risultatoVal = Number(bet.risultato ?? 0);
  const stakeRestoration = calculateStakeRestoration(bet);

  if (bet.tipo === 'Rapida') {
    // Quick bets: reverse archiving (-result) and restore initial deduction (+stake)
    return {
      bilancioAdjustment: 0,
      bilancioRapideAdjustment: -risultatoVal + stakeRestoration,
    };
  } else {
    // Normal bets: reverse archiving (-result) and restore initial deduction (+stake)
    return {
      bilancioAdjustment: -risultatoVal + stakeRestoration,
      bilancioRapideAdjustment: 0,
    };
  }
};

/**
 * Calculate balance adjustment when deleting an ongoing bet
 * @param bet - The bet being deleted
 * @returns Object with balance adjustments for regular and quick bets
 */
export const calculateOngoingBetDeletion = (bet: Bet): {
  bilancioAdjustment: number;
  bilancioRapideAdjustment: number;
} => {
  const stakeVal = Number(bet.stake) || 0;

  if (bet.tipo === 'Rapida') {
    // Quick bets are always archived, this shouldn't happen
    return {
      bilancioAdjustment: 0,
      bilancioRapideAdjustment: stakeVal,
    };
  } else if (!isFreeOrBonus(bet)) {
    // Normal ongoing bets: restore stake to balance
    return {
      bilancioAdjustment: stakeVal,
      bilancioRapideAdjustment: 0,
    };
  }

  return {
    bilancioAdjustment: 0,
    bilancioRapideAdjustment: 0,
  };
};

/**
 * Calculate the update data object for account when deleting a bet
 */
export const calculateDeleteBetUpdate = (
  bet: Bet,
  account: Account
): Partial<Account> => {
  const updateData: Partial<Account> = {};

  if (bet.stato === 'Archiviata') {
    const { bilancioAdjustment, bilancioRapideAdjustment } =
      calculateArchivedBetDeletion(bet);

    if (bilancioAdjustment !== 0) {
      updateData.bilancio_giocate =
        Number(account.bilancio_giocate) + bilancioAdjustment;
    }
    if (bilancioRapideAdjustment !== 0) {
      updateData.bilancio_giocate_rapide =
        Number(account.bilancio_giocate_rapide) + bilancioRapideAdjustment;
    }
  } else {
    // Ongoing bet
    const { bilancioAdjustment, bilancioRapideAdjustment } =
      calculateOngoingBetDeletion(bet);

    if (bilancioAdjustment !== 0) {
      updateData.bilancio_giocate =
        Number(account.bilancio_giocate) + bilancioAdjustment;
    }
    if (bilancioRapideAdjustment !== 0) {
      updateData.bilancio_giocate_rapide =
        Number(account.bilancio_giocate_rapide) + bilancioRapideAdjustment;
    }
  }

  return updateData;
};

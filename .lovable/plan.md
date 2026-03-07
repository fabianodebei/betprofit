

## Problem

The `transactions` table lacks an `intestatario` column. When calculating account balances, all transactions matching the same bookmaker name (`conto`) are summed together regardless of who owns the account. Creating a new "Bet365" account for a different person inherits all existing Bet365 transactions.

## Solution

Same pattern already applied to `bets`: add `intestatario` to `transactions` and use composite key for balance calculation.

### 1. Database Migration
Add `intestatario` column to `transactions` table:
```sql
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS intestatario text;
```

### 2. Update `TransactionContext.tsx`
- Save `intestatario` when creating transactions (`addTransaction`)
- Fetch and expose `intestatario` from DB in `fetchTransactions`
- Pass `intestatario` through on update

### 3. Update `AccountContext.tsx` — Balance Calculation (lines 250-262)
Change `saldoDisponibileMap` to use composite key `conto||intestatario` instead of just `conto`, matching the same pattern already used for bets (line 140-143). Apply the same fallback logic for old transactions without intestatario.

### 4. Update `TransactionForm.tsx`
Pass the selected account's `intestatario` when creating a transaction.

### 5. Update `types/index.ts`
Add optional `intestatario` field to `Transaction` type (if not already present).

### 6. Update `TransactionContext.tsx` — Delete Logic
The delete function (lines 130+) looks up accounts/wallets by `conto` — needs to also match by `intestatario` for correct balance reversal.


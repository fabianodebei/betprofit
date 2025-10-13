-- Add bet_id column to transactions table to link transactions to bets
ALTER TABLE public.transactions 
ADD COLUMN bet_id uuid REFERENCES public.bets(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_transactions_bet_id ON public.transactions(bet_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN public.transactions.bet_id IS 'Foreign key to bets table. When a bet is deleted, related transactions are automatically deleted.';
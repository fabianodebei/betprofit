-- Add wallet_id column to bets table
ALTER TABLE public.bets ADD COLUMN wallet_id UUID REFERENCES public.wallets(id);

-- Create index for better performance
CREATE INDEX idx_bets_wallet_id ON public.bets(wallet_id);
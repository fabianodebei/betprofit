-- Add esito (outcome) column to bets for proper lay accounting
ALTER TABLE public.bets
ADD COLUMN IF NOT EXISTS esito TEXT CHECK (esito IN ('win','loss','refund'));

-- Optional: create index to filter archived outcomes quickly
CREATE INDEX IF NOT EXISTS idx_bets_esito ON public.bets (esito);

-- Add esito_dettaglio to store losing lay id or details for multiple outcomes
ALTER TABLE public.bets
ADD COLUMN IF NOT EXISTS esito_dettaglio text;
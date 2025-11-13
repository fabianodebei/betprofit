-- Add stato_evento column to bets table
ALTER TABLE public.bets 
ADD COLUMN IF NOT EXISTS stato_evento TEXT DEFAULT 'Bozza' CHECK (stato_evento IN ('Bozza', 'In Corso', 'Vinto', 'Perso', 'Annullato'));
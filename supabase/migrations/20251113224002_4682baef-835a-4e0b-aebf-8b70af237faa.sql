-- Add stato column to lay_bets table
ALTER TABLE public.lay_bets 
ADD COLUMN stato TEXT NOT NULL DEFAULT 'Bozza';

-- Populate existing records based on attiva field
UPDATE public.lay_bets 
SET stato = CASE 
  WHEN attiva = true THEN 'In Corso'
  ELSE 'Bozza'
END;

-- Add check constraint for valid states
ALTER TABLE public.lay_bets
ADD CONSTRAINT lay_bets_stato_check 
CHECK (stato IN ('Bozza', 'In Corso', 'Vinto', 'Perso', 'Annullato'));
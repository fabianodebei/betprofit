-- Add 'attiva' column to lay_bets table
ALTER TABLE public.lay_bets 
ADD COLUMN attiva boolean NOT NULL DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN public.lay_bets.attiva IS 'Indica se la bancata è stata effettivamente piazzata. Nella strategia sequenziale, se vinci una bancata precedente, le successive non vengono giocate.';
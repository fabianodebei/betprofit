-- Create table for bet legs (individual selections in a multiple bet)
CREATE TABLE public.bet_legs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID NOT NULL,
  user_id UUID,
  evento TEXT NOT NULL,
  competizione TEXT,
  mercato TEXT,
  selezione TEXT NOT NULL,
  quota NUMERIC NOT NULL,
  stato TEXT NOT NULL DEFAULT 'In Corso',
  risultato TEXT,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bet_legs ENABLE ROW LEVEL SECURITY;

-- RLS policies for bet_legs
CREATE POLICY "Users can view own bet_legs"
ON public.bet_legs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bet_legs"
ON public.bet_legs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bet_legs"
ON public.bet_legs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bet_legs"
ON public.bet_legs
FOR DELETE
USING (auth.uid() = user_id);

-- Add columns to bets table for multiple bet features
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS percentuale_bonus NUMERIC;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS numero_minimo_selezioni INTEGER;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS quota_combinata NUMERIC;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS vincita_potenziale NUMERIC;
-- Create lay_bets table for counter bets (bancate) on multiple bets
CREATE TABLE public.lay_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL CHECK (metodo IN ('Punta', 'Banca')),
  evento TEXT NOT NULL,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL,
  mercato TEXT NOT NULL,
  conto TEXT NOT NULL,
  stake NUMERIC NOT NULL CHECK (stake > 0),
  quota_banca NUMERIC NOT NULL CHECK (quota_banca > 0),
  quota_punta NUMERIC NOT NULL CHECK (quota_punta > 0),
  tasse_percentuale NUMERIC NOT NULL DEFAULT 0 CHECK (tasse_percentuale >= 0 AND tasse_percentuale <= 100),
  url_evento TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lay_bets ENABLE ROW LEVEL SECURITY;

-- Create policy for full access (matching existing pattern)
CREATE POLICY "Allow all access to lay_bets" 
ON public.lay_bets 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster queries by parent bet
CREATE INDEX idx_lay_bets_parent_bet_id ON public.lay_bets(parent_bet_id);
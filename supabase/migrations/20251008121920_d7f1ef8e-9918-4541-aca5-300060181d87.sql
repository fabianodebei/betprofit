-- Create books table
CREATE TABLE public.books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  metodo text NOT NULL DEFAULT 'Bookmaker',
  stato text NOT NULL DEFAULT 'Abilitato',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access
CREATE POLICY "Allow all access to books" 
ON public.books 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert default bookmakers
INSERT INTO public.books (nome, metodo, stato) VALUES
('Betrebels', 'Bookmaker', 'Abilitato'),
('Eplay24', 'Bookmaker', 'Abilitato'),
('BetRoom', 'Bookmaker', 'Abilitato'),
('Bet2u', 'Bookmaker', 'Abilitato'),
('Sportwetten', 'Bookmaker', 'Abilitato'),
('Tipico', 'Bookmaker', 'Abilitato'),
('Winbet', 'Bookmaker', 'Abilitato'),
('Neobet', 'Bookmaker', 'Abilitato'),
('Happybet', 'Bookmaker', 'Abilitato'),
('Sportitaliabet', 'Bookmaker', 'Abilitato'),
('Betflag', 'Bookmaker', 'Abilitato'),
('Snai', 'Bookmaker', 'Abilitato'),
('Sisal', 'Bookmaker', 'Abilitato'),
('Eurobet', 'Bookmaker', 'Abilitato'),
('Goldbet', 'Bookmaker', 'Abilitato'),
('Lottomatica', 'Bookmaker', 'Abilitato'),
('Better', 'Bookmaker', 'Abilitato'),
('Planetwin365', 'Bookmaker', 'Abilitato'),
('William Hill', 'Bookmaker', 'Abilitato'),
('Bet365', 'Bookmaker', 'Abilitato'),
('888sport', 'Bookmaker', 'Abilitato'),
('Unibet', 'Bookmaker', 'Abilitato'),
('Bwin', 'Bookmaker', 'Abilitato'),
('Leovegas', 'Bookmaker', 'Abilitato');
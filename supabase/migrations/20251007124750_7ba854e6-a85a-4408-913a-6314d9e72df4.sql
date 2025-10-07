-- Create wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intestatario TEXT NOT NULL,
  nome TEXT NOT NULL,
  descrizione TEXT,
  saldo_attuale DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stato TEXT NOT NULL CHECK (stato IN ('Abilitato', 'Disabilitato')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intestatario TEXT NOT NULL,
  conto TEXT NOT NULL,
  descrizione TEXT,
  saldo_attuale DECIMAL(10, 2) NOT NULL DEFAULT 0,
  bilancio_giocate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  bilancio_giocate_rapide DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stato TEXT NOT NULL CHECK (stato IN ('Abilitato', 'Disabilitato')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metodo TEXT NOT NULL CHECK (metodo IN ('Deposito', 'Spesa', 'Prelievo')),
  conto TEXT NOT NULL,
  wallet TEXT,
  addebito DECIMAL(10, 2),
  accredito DECIMAL(10, 2),
  descrizione TEXT,
  registrato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bets table
CREATE TABLE public.bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('Singola', 'Multipla', 'Casino', 'Rapida')),
  conto TEXT NOT NULL,
  stake DECIMAL(10, 2) NOT NULL,
  quota DECIMAL(10, 2),
  evento TEXT,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL,
  metodo TEXT,
  tipo_bonus TEXT CHECK (tipo_bonus IN ('Nessuno', 'Bonus', 'Rimborso', 'Free Bet')),
  bonus DECIMAL(10, 2),
  rimborso DECIMAL(10, 2),
  stato TEXT NOT NULL CHECK (stato IN ('In Corso', 'Archiviata')),
  risultato DECIMAL(10, 2),
  tag TEXT,
  note TEXT,
  mercato TEXT,
  competizione TEXT,
  url_evento TEXT,
  nome_gioco TEXT,
  quota_punta DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now, adjust based on auth requirements)
CREATE POLICY "Allow all access to wallets" ON public.wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to bets" ON public.bets FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_transactions_conto ON public.transactions(conto);
CREATE INDEX idx_transactions_registrato ON public.transactions(registrato);
CREATE INDEX idx_bets_conto ON public.bets(conto);
CREATE INDEX idx_bets_stato ON public.bets(stato);
CREATE INDEX idx_bets_tipo ON public.bets(tipo);
CREATE INDEX idx_bets_created_at ON public.bets(created_at);
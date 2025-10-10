-- Create oddsmatcher_history table to track opportunities
CREATE TABLE public.oddsmatcher_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  competition TEXT,
  market TEXT NOT NULL,
  bookmaker TEXT NOT NULL,
  quota_punta NUMERIC NOT NULL,
  exchange TEXT NOT NULL,
  quota_banca NUMERIC NOT NULL,
  rating NUMERIC NOT NULL,
  profit_estimate NUMERIC NOT NULL,
  commission NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'found',
  bet_id UUID,
  found_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_oddsmatcher_settings table
CREATE TABLE public.user_oddsmatcher_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  betfair_commission NUMERIC NOT NULL DEFAULT 4.5,
  betfair_enabled BOOLEAN NOT NULL DEFAULT true,
  betflag_commission NUMERIC NOT NULL DEFAULT 5.0,
  betflag_enabled BOOLEAN NOT NULL DEFAULT true,
  min_rating NUMERIC NOT NULL DEFAULT 75,
  auto_refresh_minutes INTEGER NOT NULL DEFAULT 5,
  default_stake NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on oddsmatcher_history
ALTER TABLE public.oddsmatcher_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for oddsmatcher_history
CREATE POLICY "Users can view own oddsmatcher history"
  ON public.oddsmatcher_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oddsmatcher history"
  ON public.oddsmatcher_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oddsmatcher history"
  ON public.oddsmatcher_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oddsmatcher history"
  ON public.oddsmatcher_history FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on user_oddsmatcher_settings
ALTER TABLE public.user_oddsmatcher_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_oddsmatcher_settings
CREATE POLICY "Users can view own oddsmatcher settings"
  ON public.user_oddsmatcher_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oddsmatcher settings"
  ON public.user_oddsmatcher_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oddsmatcher settings"
  ON public.user_oddsmatcher_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_oddsmatcher_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_user_oddsmatcher_settings_updated_at
  BEFORE UPDATE ON public.user_oddsmatcher_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_oddsmatcher_settings_updated_at();
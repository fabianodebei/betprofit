-- Create reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metodo TEXT NOT NULL,
  conto TEXT NOT NULL,
  descrizione TEXT NOT NULL,
  data_di_scadenza TIMESTAMP WITH TIME ZONE NOT NULL,
  notifica_periodo TEXT NOT NULL,
  stato TEXT NOT NULL DEFAULT 'Nuovo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (since there's no auth in this app)
CREATE POLICY "Allow all access to reminders"
ON public.reminders
FOR ALL
USING (true)
WITH CHECK (true);
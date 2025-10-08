-- Create tags table
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access
CREATE POLICY "Allow all access to tags" 
ON public.tags 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Enable realtime for tags table
ALTER TABLE public.tags REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Insert default tags
INSERT INTO public.tags (nome) VALUES
('Profilazione'),
('value bet'),
('Poker');
-- Enable realtime for books table
ALTER TABLE public.books REPLICA IDENTITY FULL;

DO $$
BEGIN
  -- Add table to realtime publication if not already present
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
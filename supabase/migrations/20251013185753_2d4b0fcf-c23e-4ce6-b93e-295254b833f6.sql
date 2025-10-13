-- Drop the security definer view
DROP VIEW IF EXISTS public.available_public_books;

-- Add RLS policy to allow users to view public books
CREATE POLICY "Users can view public books"
ON public.books
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);
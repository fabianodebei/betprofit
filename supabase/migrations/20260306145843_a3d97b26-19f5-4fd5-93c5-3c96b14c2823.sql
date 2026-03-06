-- Fix: the two SELECT policies are both RESTRICTIVE, blocking public books for other users
-- Drop both and recreate as PERMISSIVE so either condition grants access
DROP POLICY IF EXISTS "Users can view own books" ON public.books;
DROP POLICY IF EXISTS "Users can view public books" ON public.books;

CREATE POLICY "Users can view own or public books"
ON public.books FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR (is_public = true));
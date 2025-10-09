-- Promote user to admin role
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
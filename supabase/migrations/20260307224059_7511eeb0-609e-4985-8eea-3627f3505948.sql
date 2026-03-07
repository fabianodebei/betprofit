
CREATE TABLE public.user_proxies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proxy_host text NOT NULL,
  http_port integer NOT NULL,
  socks5_port integer NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.user_proxies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proxy"
ON public.user_proxies
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert proxies"
ON public.user_proxies
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update proxies"
ON public.user_proxies
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete proxies"
ON public.user_proxies
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

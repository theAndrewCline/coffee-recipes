-- migrate:up

CREATE TABLE IF NOT EXISTS public.user ( 
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  email_verified timestamp
);

CREATE TABLE IF NOT EXISTS public.account (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.user(id) ON DELETE CASCADE,
  type text,
  provider text,
  provider_account_id text,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text
);

CREATE TABLE IF NOT EXISTS public.session (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expires timestamp NOT NULL,
  session_token text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.user(id) ON delete cascade
);

CREATE TABLE IF NOT EXISTS public.verification_token (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp NOT NULL
);
-- migrate:down

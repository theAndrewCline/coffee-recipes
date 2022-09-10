-- migrate:up

CREATE TABLE IF NOT EXISTS "user" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  email_verified timestamp
);

CREATE TABLE IF NOT EXISTS "account" (

);

-- migrate:down

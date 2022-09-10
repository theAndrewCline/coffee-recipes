-- migrate:up

CREATE TABLE IF NOT EXISTS "user" (
  id serial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  email_verified timestamp NOT NULL
);

-- migrate:down

-- Create the session table with the exact structure connect-pg-simple expects
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Add index for session expiration to improve query performance
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire"); 
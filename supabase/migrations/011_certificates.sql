-- Add certificates JSONB column to profiles
-- Stores: { "cert_id": "YYYY-MM-DD", ... } — key = cert type, value = date earned

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS certificates JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS profiles_certificates_gin
  ON profiles USING gin (certificates);

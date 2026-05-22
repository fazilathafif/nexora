-- ── Subscription columns on profiles ─────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan                            TEXT        NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at                   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  ADD COLUMN IF NOT EXISTS stripe_customer_id              TEXT        UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id          TEXT        UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_price_id                 TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status             TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS referral_code                   TEXT        UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by                     TEXT;

-- Backfill referral codes for existing users (8-char uppercase hex)
UPDATE profiles
SET referral_code = upper(substring(md5(id::text) for 8))
WHERE referral_code IS NULL;

-- plan must be one of the known values
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('trial','free','lite','premium','group'));

-- ── Referrals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending',  -- pending | converted
  rewarded_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_id),
  CONSTRAINT referrals_status_check CHECK (status IN ('pending','converted'))
);

-- ── Groups / school licences ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  join_code               TEXT        NOT NULL UNIQUE,
  seats_total             INTEGER     NOT NULL DEFAULT 5,
  seats_used              INTEGER     NOT NULL DEFAULT 0,
  stripe_subscription_id  TEXT,
  expires_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- ── AI usage daily counter ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  count    INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- ── RLS: users can only see / modify their own rows ───────────────────────────
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referrals_self ON referrals
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY groups_admin ON groups
  USING (admin_user_id = auth.uid());
CREATE POLICY groups_member ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM profiles WHERE id = auth.uid())
  );

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_usage_self ON ai_usage
  USING (user_id = auth.uid());

-- Service-role bypass needed by the webhook (Supabase service key bypasses RLS automatically)

-- ============================================================
-- Nexora — Migration 009: IB Survival Sandbox (sidecar schema)
-- ZERO changes to existing tables. All new tables are prefixed
-- sb_ and linked via foreign key to profiles(id) only.
-- Feature flag: set features.ib_survival_sandbox = true in env.
-- Run via Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Feature flag table ────────────────────────────────────────────────────────
-- Stores app-level feature flags. Checked at runtime.
CREATE TABLE IF NOT EXISTS sb_feature_flags (
  key          TEXT PRIMARY KEY,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  description  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the flag
INSERT INTO sb_feature_flags (key, enabled, description)
VALUES ('ib_survival_sandbox', true, 'IB Survival Sandbox module — IA blueprinting, CAS linker, deadline calendar')
ON CONFLICT (key) DO NOTHING;

-- ── Sandbox Profile ───────────────────────────────────────────────────────────
-- One-to-one with profiles(id). Isolated extension record.
CREATE TABLE IF NOT EXISTS sb_sandbox_profile (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  onboarded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  stress_mode    BOOLEAN NOT NULL DEFAULT false,  -- true when stress index > 8
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sb_sandbox_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_sandbox_profile: own row" ON sb_sandbox_profile
  FOR ALL USING (auth.uid() = user_id);

-- ── IA Tracker ────────────────────────────────────────────────────────────────
-- Tracks each IB Internal Assessment per subject.
-- subject_id and syllabus_topic_id are taxonomy keys that bridge into
-- the existing question bank (getQuestions('ib', subject_id)).
CREATE TABLE IF NOT EXISTS sb_ia_tracker (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id         TEXT NOT NULL,          -- e.g. 'ib_biology' — existing taxonomy key
  syllabus_topic_id  TEXT NOT NULL,          -- topic within that subject for question fetch
  title              TEXT,                  -- e.g. "Effect of Temperature on Enzyme Activity"
  rq                 TEXT,                  -- Research Question
  word_count_target  INTEGER DEFAULT 3000,
  word_count_current INTEGER DEFAULT 0,
  milestone_flags    JSONB NOT NULL DEFAULT '{}',  -- { "0":true, "3":true, ... }
  due_date           DATE,
  supervisor_name    TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id)
);

ALTER TABLE sb_ia_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_ia_tracker: own rows" ON sb_ia_tracker
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sb_ia_user ON sb_ia_tracker(user_id);

-- ── CAS Linker ────────────────────────────────────────────────────────────────
-- Connects CAS activity log entries to university application prompts.
CREATE TABLE IF NOT EXISTS sb_cas_linker (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pillar           TEXT NOT NULL CHECK (pillar IN ('creativity','activity','service')),
  activity_name    TEXT NOT NULL,
  hours_logged     NUMERIC(5,1) NOT NULL DEFAULT 0,
  learning_outcome TEXT,                    -- IB LO mapped
  uni_prompt_hook  TEXT,                    -- e.g. "Describe a challenge you overcame"
  evidence_url     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sb_cas_linker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_cas_linker: own rows" ON sb_cas_linker
  FOR ALL USING (auth.uid() = user_id);

-- ── Assessment Deadlines ─────────────────────────────────────────────────────
-- Tracks IB coursework milestones with a stress weight (1-5).
-- stress_weight drives the Stress Index calculation on the backend.
CREATE TABLE IF NOT EXISTS sb_assessment_deadline (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id     TEXT,                          -- optional link to ib subject
  title          TEXT NOT NULL,
  deadline_date  DATE NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('ia_draft','ia_final','ee_draft','ee_final','tok_essay','tok_exhibition','mock','other')),
  stress_weight  INTEGER NOT NULL DEFAULT 3 CHECK (stress_weight BETWEEN 1 AND 5),
  completed      BOOLEAN NOT NULL DEFAULT false,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sb_assessment_deadline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_assessment_deadline: own rows" ON sb_assessment_deadline
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sb_deadline_user_date ON sb_assessment_deadline(user_id, deadline_date);

-- ── Stress Index Cache ────────────────────────────────────────────────────────
-- Caches the computed weekly stress index to avoid recalculating on every render.
-- Refreshed by the backend endpoint.
CREATE TABLE IF NOT EXISTS sb_stress_cache (
  user_id       UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stress_index  INTEGER NOT NULL DEFAULT 0,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sb_stress_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_stress_cache: own row" ON sb_stress_cache
  FOR ALL USING (auth.uid() = user_id);

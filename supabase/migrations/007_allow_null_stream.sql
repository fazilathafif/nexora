-- ============================================================
-- Nexora — Migration 007: Allow NULL stream on new user signup
-- The handle_new_user trigger inserts stream=NULL for new Google
-- sign-ups. The old check constraint rejected NULL, causing
-- "Database error saving new user" on first Google login.
-- Run via Supabase Dashboard → SQL Editor
-- ============================================================

-- profiles.stream — allow NULL (new users haven't chosen a track yet)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_stream_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_stream_check
    CHECK (stream IS NULL OR stream IN ('gcse','alevel','sat','act','ap','psat','igcse','ib'));

-- profiles.active_stream — also allow NULL
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_active_stream_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_active_stream_check
    CHECK (active_stream IS NULL OR active_stream IN ('gcse','alevel','sat','act','ap','psat','igcse','ib'));

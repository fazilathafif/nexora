-- ============================================================
-- Nexora — Migration 008: Fix plan/trial for existing users
-- Run via Supabase Dashboard → SQL Editor
-- ============================================================

-- Give all users without an active trial a fresh 7-day trial
UPDATE profiles
SET trial_ends_at = NOW() + INTERVAL '7 days',
    plan = 'trial'
WHERE trial_ends_at IS NULL
   OR trial_ends_at < NOW();

-- Fix trigger to explicitly set plan='trial' on new sign-ups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, xp, streak, stream, streams, exam_dates, plan, trial_ends_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Student'),
    0, 0, NULL, '{}', '{}',
    'trial',
    NOW() + INTERVAL '7 days',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

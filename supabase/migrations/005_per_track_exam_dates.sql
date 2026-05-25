-- Migration 005: Per-track exam dates + 7-day trial default

-- Add JSONB column for per-track exam dates
-- { gcse: '2025-06-15', sat: '2025-03-08', ... }
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exam_dates JSONB DEFAULT '{}';

-- Migrate existing single exam_date into exam_dates for the user's primary stream
UPDATE profiles
SET exam_dates = jsonb_build_object(COALESCE(stream, 'gcse'), exam_date::text)
WHERE exam_date IS NOT NULL
  AND exam_date::text != ''
  AND (exam_dates IS NULL OR exam_dates = '{}');

-- RPC for atomic JSONB merge (avoids overwriting other stream dates on PATCH)
CREATE OR REPLACE FUNCTION set_exam_date(p_user_id uuid, p_stream text, p_date text)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE profiles
  SET exam_dates = COALESCE(exam_dates, '{}'::jsonb) || jsonb_build_object(p_stream, p_date),
      updated_at = now()
  WHERE id = p_user_id;
$$;

-- Update trial window to 7 days for new signups going forward.
-- Existing users keep whatever trial_expires_at was set by migration 001_subscription.
-- The handle_new_user trigger inserts trial_expires_at = NOW() + 14 days.
-- Replace with 7 days:
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, xp, streak, stream, streams, exam_dates, trial_expires_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Student'),
    0, 0, NULL, '{}', '{}',
    NOW() + INTERVAL '7 days',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

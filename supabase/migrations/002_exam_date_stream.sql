-- ============================================================
-- Nexora — Migration 002: exam date + answers stream column
-- Run via: supabase db push
-- ============================================================

-- Exam date on profiles (used for countdown banner on HomePage)
alter table profiles
  add column if not exists exam_date date;

-- Stream column on answers (needed for per-stream topic accuracy)
alter table answers
  add column if not exists stream text
    check (stream in ('gcse','alevel'));

-- Back-fill stream from the parent session
update answers a
  set stream = s.stream
  from sessions s
  where a.session_id = s.id
    and a.stream is null;

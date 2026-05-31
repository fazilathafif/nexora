-- ============================================================
-- Nexora — Migration 006: IGCSE and IB Diploma tracks
-- Run via Supabase Dashboard → SQL Editor, or: supabase db push
-- ============================================================

-- ── profiles: active_stream ──────────────────────────────────────────────────

alter table profiles
  drop constraint if exists profiles_active_stream_check;

alter table profiles
  add constraint profiles_active_stream_check
    check (active_stream in ('gcse','alevel','sat','act','ap','psat','igcse','ib'));

-- ── profiles: stream ─────────────────────────────────────────────────────────

alter table profiles
  drop constraint if exists profiles_stream_check;

alter table profiles
  add constraint profiles_stream_check
    check (stream in ('gcse','alevel','sat','act','ap','psat','igcse','ib'));

-- ── sessions: stream ─────────────────────────────────────────────────────────

alter table sessions
  drop constraint if exists sessions_stream_check;

alter table sessions
  add constraint sessions_stream_check
    check (stream in ('gcse','alevel','sat','act','ap','psat','igcse','ib'));

-- ── answers: stream ──────────────────────────────────────────────────────────

alter table answers
  drop constraint if exists answers_stream_check;

alter table answers
  add constraint answers_stream_check
    check (stream in ('gcse','alevel','sat','act','ap','psat','igcse','ib'));

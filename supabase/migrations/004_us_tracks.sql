-- ============================================================
-- Nexora — Migration 004: US tracks + multi-stream + preferences
-- Local dev only — run via: supabase db push (local instance)
-- ============================================================

-- ── Extend profiles for multi-stream enrolment ───────────────────────────────

-- streams: all tracks the user is enrolled in (e.g. '{gcse,sat}')
alter table profiles
  add column if not exists streams       text[]  not null default '{}';

-- active_stream: the track currently being practiced
alter table profiles
  add column if not exists active_stream text
    check (active_stream in ('gcse','alevel','sat','act','ap','psat'));

-- Backfill from existing single-value stream column
update profiles
  set streams       = array[stream],
      active_stream = stream
  where stream is not null
    and array_length(streams, 1) is null;

-- Extend stream check constraint to include US tracks
alter table profiles
  drop constraint if exists profiles_stream_check;

alter table profiles
  add constraint profiles_stream_check
    check (stream in ('gcse','alevel','sat','act','ap','psat'));

-- ── Extend sessions to accept US streams ─────────────────────────────────────

alter table sessions
  drop constraint if exists sessions_stream_check;

alter table sessions
  add constraint sessions_stream_check
    check (stream in ('gcse','alevel','sat','act','ap','psat'));

-- ── Extend answers stream check ───────────────────────────────────────────────

alter table answers
  drop constraint if exists answers_stream_check;

alter table answers
  add constraint answers_stream_check
    check (stream in ('gcse','alevel','sat','act','ap','psat'));

-- ── User preferences table ────────────────────────────────────────────────────

create table if not exists user_preferences (
  user_id          uuid        primary key references profiles(id) on delete cascade,
  font_size        text        not null default 'medium'
                                 check (font_size in ('small','medium','large','xl')),
  high_contrast    boolean     not null default false,
  reduce_motion    boolean     not null default false,
  dyslexia_font    boolean     not null default false,
  color_blind_mode text        not null default 'none'
                                 check (color_blind_mode in ('none','deuteranopia','protanopia','tritanopia')),
  updated_at       timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "user_preferences: own row" on user_preferences
  for all using (auth.uid() = user_id);

-- ── AP subject selections ─────────────────────────────────────────────────────

create table if not exists user_ap_subjects (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  subject_id  text        not null,   -- matches STREAM_CONFIG ap subject id
  enrolled_at timestamptz not null default now(),
  unique (user_id, subject_id)
);

alter table user_ap_subjects enable row level security;

create policy "user_ap_subjects: own rows" on user_ap_subjects
  for all using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_profiles_streams on profiles using gin(streams);
create index if not exists idx_sessions_stream  on sessions(user_id, stream, started_at desc);

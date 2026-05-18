-- ============================================================
-- BrightPath — Initial Schema
-- Run via: supabase db push
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- One row per user. Created automatically on first sign-in (see trigger below).
create table if not exists profiles (
  id                uuid        primary key references auth.users(id) on delete cascade,
  display_name      text        not null default 'Student',
  stream            text        check (stream in ('gcse','alevel')),
  xp                integer     not null default 0,
  streak            integer     not null default 0,
  last_active_date  date,
  teacher_id        uuid,                 -- set when student joins a class
  updated_at        timestamptz not null default now()
);

-- RLS: users can only read/write their own profile
alter table profiles enable row level security;

create policy "profiles: own row" on profiles
  for all using (auth.uid() = id);

-- ── Sessions ──────────────────────────────────────────────────────────────────
-- One row per quiz attempt (start → finish).
create table if not exists sessions (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references profiles(id) on delete cascade,
  stream           text        not null check (stream in ('gcse','alevel')),
  subject          text        not null,
  total_questions  integer     not null,
  score            integer,
  duration_seconds integer,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz
);

alter table sessions enable row level security;

create policy "sessions: own rows" on sessions
  for all using (auth.uid() = user_id);

-- ── Answers ───────────────────────────────────────────────────────────────────
-- One row per question answered. Used for topic accuracy + spaced repetition.
create table if not exists answers (
  id             uuid        primary key default uuid_generate_v4(),
  session_id     uuid        not null references sessions(id) on delete cascade,
  user_id        uuid        not null references profiles(id) on delete cascade,
  question_id    text        not null,   -- e.g. "maths_001"
  topic          text        not null,
  chosen_index   integer     not null,
  correct_index  integer     not null,
  is_correct     boolean     not null,
  hint_used      boolean     not null default false,
  answered_at    timestamptz not null default now()
);

alter table answers enable row level security;

create policy "answers: own rows" on answers
  for all using (auth.uid() = user_id);

-- ── Daily activity ────────────────────────────────────────────────────────────
-- One row per (user, date). Used for weekly heatmap and streak calculation.
create table if not exists daily_activity (
  user_id  uuid  not null references profiles(id) on delete cascade,
  date     date  not null,
  sessions integer not null default 1,
  primary key (user_id, date)
);

alter table daily_activity enable row level security;

create policy "daily_activity: own rows" on daily_activity
  for all using (auth.uid() = user_id);

-- Upsert: increment sessions count on conflict
create or replace function increment_daily_sessions()
returns trigger language plpgsql as $$
begin
  -- If row already exists, increment sessions
  update daily_activity
  set sessions = sessions + 1
  where user_id = new.user_id and date = new.date;
  -- If update touched a row, skip the insert
  if found then return null; end if;
  return new;
end;
$$;

create trigger daily_activity_upsert
  before insert on daily_activity
  for each row execute function increment_daily_sessions();

-- ── Teacher tokens ────────────────────────────────────────────────────────────
-- Short tokens map to a teacher_id → used in /teacher/:token URLs.
create table if not exists teacher_tokens (
  token       text      primary key,
  teacher_id  uuid      not null,
  label       text,                    -- e.g. "Year 9 Maths Set 1"
  created_at  timestamptz not null default now()
);

-- Public read (no auth needed — the token IS the credential)
alter table teacher_tokens enable row level security;
create policy "teacher_tokens: public read" on teacher_tokens
  for select using (true);

-- ── XP increment RPC ─────────────────────────────────────────────────────────
-- Safe atomic increment — avoids race conditions from multiple tabs.
create or replace function increment_xp(user_id uuid, amount integer)
returns void language sql security definer as $$
  update profiles set xp = xp + amount where id = user_id;
$$;

-- ── Class summary RPC ─────────────────────────────────────────────────────────
-- Used by TeacherPage to get aggregated class data via a single call.
create or replace function get_class_summary(token text)
returns json language plpgsql security definer as $$
declare
  tid uuid;
  result json;
begin
  -- Resolve token → teacher_id
  select teacher_id into tid from teacher_tokens where teacher_tokens.token = token;
  if tid is null then raise exception 'invalid token'; end if;

  select json_build_object(
    'student_count',  (select count(*) from profiles where teacher_id = tid),
    'avg_score',      (select round(avg(score::numeric / total_questions * 100))
                         from sessions s
                         join profiles p on p.id = s.user_id
                         where p.teacher_id = tid and s.completed_at is not null),
    'avg_streak',     (select round(avg(streak)) from profiles where teacher_id = tid),
    'topic_accuracy', (
      select json_agg(json_build_object('topic', topic, 'pct', pct))
      from (
        select a.topic,
               round(avg(case when a.is_correct then 100 else 0 end)) as pct
        from answers a
        join profiles p on p.id = a.user_id
        where p.teacher_id = tid
        group by a.topic
        order by pct asc
      ) t
    ),
    'students', (
      select json_agg(json_build_object(
        'display_name', p.display_name,
        'stream',       p.stream,
        'sessions',     (select count(*) from sessions s where s.user_id = p.id),
        'avg_score',    (select round(avg(score::numeric/total_questions*100))
                           from sessions s where s.user_id=p.id and s.completed_at is not null),
        'streak',       p.streak,
        'xp',           p.xp
      ))
      from profiles p
      where p.teacher_id = tid
    )
  ) into result;

  return result;
end;
$$;

-- ── Auto-create profile on sign-up ────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Student'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

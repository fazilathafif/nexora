-- ============================================================
-- Nexora — Migration 003: sysadmin stats RPC
-- Run via: Supabase SQL Editor
-- ============================================================

create or replace function get_admin_stats()
returns json language plpgsql security definer as $$
begin
  return json_build_object(
    'total_users',        (select count(*) from profiles),
    'total_sessions',     (select count(*) from sessions where completed_at is not null),
    'sessions_today',     (select count(*) from sessions
                           where completed_at::date = current_date),
    'sessions_this_week', (select count(*) from sessions
                           where completed_at >= current_date - interval '7 days'),
    'total_answers',      (select count(*) from answers),
    'gcse_users',         (select count(*) from profiles where stream = 'gcse'),
    'alevel_users',       (select count(*) from profiles where stream = 'alevel'),
    'signups_this_week',  (select count(*) from profiles
                           where updated_at >= current_date - interval '7 days')
  );
end;
$$;

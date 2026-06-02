-- ============================================================
-- Nexora — Migration 010: Groups V2 — Parent/Teacher Licensing
-- Run via Supabase Dashboard → SQL Editor
-- Zero changes to core quiz/answer/session tables.
-- ============================================================

-- ── 1. Add missing fields to profiles ────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role        TEXT        NOT NULL DEFAULT 'student'
    CHECK (role IN ('student','teacher','parent','admin')),
  ADD COLUMN IF NOT EXISTS parent_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_admin    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email       TEXT,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_parent  ON profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role    ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email   ON profiles(email);

-- ── 2. Extend groups table ────────────────────────────────────────────────────

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS group_type   TEXT NOT NULL DEFAULT 'class'
    CHECK (group_type IN ('class','family','tutor')),
  ADD COLUMN IF NOT EXISTS label        TEXT,
  ADD COLUMN IF NOT EXISTS admin_name   TEXT,
  ADD COLUMN IF NOT EXISTS admin_email  TEXT,
  ADD COLUMN IF NOT EXISTS tracks       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS plan_override TEXT NOT NULL DEFAULT 'group'
    CHECK (plan_override IN ('trial','free','lite','premium','group')),
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── 3. Group invites table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_invites (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id     UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email        TEXT,
  token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  role         TEXT        NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','parent')),
  ward_name    TEXT,        -- for parent inviting a child
  accepted_at  TIMESTAMPTZ,
  accepted_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Group admin can manage invites; public can read own invite by token
CREATE POLICY "group_invites: admin manage" ON group_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_id AND g.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "group_invites: public read by token" ON group_invites
  FOR SELECT USING (true);  -- token IS the credential

CREATE INDEX IF NOT EXISTS idx_group_invites_token    ON group_invites(token);
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);

-- ── 4. admin_get_users RPC (fixes SysAdmin page) ──────────────────────────────

CREATE OR REPLACE FUNCTION admin_get_users(
  p_search TEXT DEFAULT NULL,
  p_plan   TEXT DEFAULT NULL,
  p_limit  INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  email         TEXT,
  display_name  TEXT,
  plan          TEXT,
  role          TEXT,
  streams       TEXT[],
  active_stream TEXT,
  streak        INTEGER,
  xp            INTEGER,
  group_id      UUID,
  is_admin      BOOLEAN,
  trial_ends_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.email, u.email)::TEXT AS email,
    p.display_name,
    p.plan,
    p.role,
    p.streams,
    p.active_stream,
    p.streak,
    p.xp,
    p.group_id,
    p.is_admin,
    p.trial_ends_at,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE
    (p_search IS NULL OR
      p.display_name ILIKE '%' || p_search || '%' OR
      COALESCE(p.email, u.email) ILIKE '%' || p_search || '%')
    AND
    (p_plan IS NULL OR p.plan = p_plan)
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ── 5. RPC: create_group ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_group(
  p_label       TEXT,
  p_group_type  TEXT DEFAULT 'class',
  p_tracks      TEXT[] DEFAULT '{}',
  p_seats_total INTEGER DEFAULT 5
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group_id  UUID;
  v_join_code TEXT;
BEGIN
  -- Generate unique 8-char join code
  v_join_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));

  INSERT INTO groups (admin_user_id, label, group_type, tracks, seats_total, join_code, updated_at)
  VALUES (auth.uid(), p_label, p_group_type, p_tracks, p_seats_total, v_join_code, now())
  RETURNING id INTO v_group_id;

  -- Set creator's role to teacher/parent and link to group
  UPDATE profiles
  SET role = CASE WHEN p_group_type = 'family' THEN 'parent' ELSE 'teacher' END,
      group_id = v_group_id,
      updated_at = now()
  WHERE id = auth.uid();

  RETURN v_group_id;
END;
$$;

-- ── 6. RPC: join_group_by_code ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION join_group_by_code(p_join_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group groups%ROWTYPE;
BEGIN
  SELECT * INTO v_group FROM groups WHERE join_code = upper(p_join_code) LIMIT 1;

  IF v_group.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid join code');
  END IF;

  IF v_group.seats_used >= v_group.seats_total THEN
    RETURN jsonb_build_object('error', 'Group is full');
  END IF;

  UPDATE profiles
  SET group_id = v_group.id,
      plan = v_group.plan_override,
      updated_at = now()
  WHERE id = auth.uid();

  UPDATE groups
  SET seats_used = seats_used + 1, updated_at = now()
  WHERE id = v_group.id;

  RETURN jsonb_build_object('success', true, 'group_id', v_group.id, 'label', v_group.label);
END;
$$;

-- ── 7. RPC: accept_group_invite ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION accept_group_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invite group_invites%ROWTYPE;
  v_group  groups%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM group_invites
  WHERE token = p_token AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invite not found or expired');
  END IF;

  SELECT * INTO v_group FROM groups WHERE id = v_invite.group_id;

  IF v_group.seats_used >= v_group.seats_total THEN
    RETURN jsonb_build_object('error', 'Group is full');
  END IF;

  UPDATE profiles
  SET group_id = v_invite.group_id,
      plan = v_group.plan_override,
      updated_at = now()
  WHERE id = auth.uid();

  UPDATE groups
  SET seats_used = seats_used + 1, updated_at = now()
  WHERE id = v_invite.group_id;

  UPDATE group_invites
  SET accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'group_id', v_invite.group_id, 'label', v_group.label);
END;
$$;

-- ── 8. RPC: get_group_dashboard ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_group_dashboard(p_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group groups%ROWTYPE;
  v_members JSONB;
  v_stats JSONB;
BEGIN
  SELECT * INTO v_group FROM groups WHERE id = p_group_id AND admin_user_id = auth.uid();

  IF v_group.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authorised');
  END IF;

  -- Member list with stats
  SELECT jsonb_agg(jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'email', COALESCE(p.email, u.email),
    'streams', p.streams,
    'active_stream', p.active_stream,
    'streak', p.streak,
    'xp', p.xp,
    'plan', p.plan,
    'role', p.role,
    'last_active_date', p.last_active_date
  ) ORDER BY p.streak DESC)
  INTO v_members
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.group_id = p_group_id AND p.id != auth.uid();

  -- Aggregate stats
  SELECT jsonb_build_object(
    'member_count', COUNT(*),
    'avg_streak', ROUND(AVG(streak)),
    'avg_xp', ROUND(AVG(xp)),
    'active_today', COUNT(*) FILTER (WHERE last_active_date = CURRENT_DATE)
  )
  INTO v_stats
  FROM profiles
  WHERE group_id = p_group_id AND id != auth.uid();

  RETURN jsonb_build_object(
    'group', row_to_json(v_group),
    'members', COALESCE(v_members, '[]'::jsonb),
    'stats', v_stats
  );
END;
$$;

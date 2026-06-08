-- Add last_sign_in_at to admin_get_users RPC
-- Pulls from auth.users.last_sign_in_at which Supabase populates on every login

CREATE OR REPLACE FUNCTION admin_get_users(
  p_search TEXT DEFAULT NULL,
  p_plan   TEXT DEFAULT NULL,
  p_limit  INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id              UUID,
  email           TEXT,
  display_name    TEXT,
  plan            TEXT,
  role            TEXT,
  streams         TEXT[],
  active_stream   TEXT,
  streak          INTEGER,
  xp              INTEGER,
  group_id        UUID,
  is_admin        BOOLEAN,
  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
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
    p.created_at,
    u.last_sign_in_at
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

-- Fix duplicate users in admin lists caused by multiple subscription rows per user.
-- Use LATERAL subquery to pick only the most recent subscription for each user.

CREATE OR REPLACE FUNCTION admin_list_users(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(t) INTO result FROM (
    SELECT
      p.id,
      p.display_name,
      au.email,
      p.created_at,
      (SELECT count(*) FROM worlds w WHERE w.user_id = p.id AND w.archived_at IS NULL) AS world_count,
      (SELECT count(*) FROM worksheets ws WHERE ws.user_id = p.id AND ws.archived_at IS NULL) AS worksheet_count,
      latest_sub.status AS subscription_status,
      latest_sub.plan_type,
      latest_sub.current_period_end
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    LEFT JOIN LATERAL (
      SELECT s.status, s.plan_type, s.current_period_end
      FROM subscriptions s
      WHERE s.user_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 1
    ) latest_sub ON true
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION admin_search_users(
  p_query TEXT,
  p_limit INT DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
DECLARE search_pattern TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  search_pattern := '%' || lower(p_query) || '%';

  SELECT json_agg(t) INTO result FROM (
    SELECT
      p.id,
      p.display_name,
      au.email,
      p.created_at,
      (SELECT count(*) FROM worlds w WHERE w.user_id = p.id AND w.archived_at IS NULL) AS world_count,
      (SELECT count(*) FROM worksheets ws WHERE ws.user_id = p.id AND ws.archived_at IS NULL) AS worksheet_count,
      latest_sub.status AS subscription_status,
      latest_sub.plan_type,
      latest_sub.current_period_end
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    LEFT JOIN LATERAL (
      SELECT s.status, s.plan_type, s.current_period_end
      FROM subscriptions s
      WHERE s.user_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 1
    ) latest_sub ON true
    WHERE lower(COALESCE(p.display_name, '')) LIKE search_pattern
       OR lower(COALESCE(au.email, '')) LIKE search_pattern
    ORDER BY p.created_at DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

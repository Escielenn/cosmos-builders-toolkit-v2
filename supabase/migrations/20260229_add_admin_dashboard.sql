-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- ============================================================
-- Admin aggregate stats RPC
-- ============================================================
CREATE OR REPLACE FUNCTION admin_get_stats()
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

  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'total_worlds', (SELECT count(*) FROM worlds WHERE archived_at IS NULL),
    'total_worksheets', (SELECT count(*) FROM worksheets WHERE archived_at IS NULL),
    'active_subscriptions', (SELECT count(*) FROM subscriptions WHERE status = 'active'),
    'open_tickets', (SELECT count(*) FROM support_tickets WHERE status IN ('open', 'in_progress')),
    'unread_contacts', (SELECT count(*) FROM contact_submissions WHERE status = 'new'),
    'users_last_7d', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '7 days'),
    'users_last_30d', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '30 days')
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- Admin list support tickets
-- ============================================================
CREATE OR REPLACE FUNCTION admin_list_tickets(
  p_status TEXT DEFAULT NULL,
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
    SELECT id, ticket_number, name, email, category, priority, subject, message, status, created_at, updated_at
    FROM support_tickets
    WHERE (p_status IS NULL OR status = p_status)
    ORDER BY
      CASE WHEN status IN ('open', 'in_progress') THEN 0 ELSE 1 END,
      CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
      created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ============================================================
-- Admin list contact submissions
-- ============================================================
CREATE OR REPLACE FUNCTION admin_list_contacts(
  p_status TEXT DEFAULT NULL,
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
    SELECT id, name, email, message, status, created_at, updated_at
    FROM contact_submissions
    WHERE (p_status IS NULL OR status = p_status)
    ORDER BY
      CASE status WHEN 'new' THEN 0 WHEN 'read' THEN 1 WHEN 'responded' THEN 2 ELSE 3 END,
      created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ============================================================
-- Admin update ticket status
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_ticket_status(
  p_ticket_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE support_tickets SET status = p_status, updated_at = now() WHERE id = p_ticket_id;
END;
$$;

-- ============================================================
-- Admin update contact status
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_contact_status(
  p_contact_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE contact_submissions SET status = p_status, updated_at = now() WHERE id = p_contact_id;
END;
$$;

-- ============================================================
-- Admin list users (metadata only — no content)
-- ============================================================
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
      p.created_at,
      (SELECT count(*) FROM worlds w WHERE w.user_id = p.id AND w.archived_at IS NULL) AS world_count,
      (SELECT count(*) FROM worksheets ws WHERE ws.user_id = p.id AND ws.archived_at IS NULL) AS worksheet_count,
      s.status AS subscription_status,
      s.current_period_end
    FROM profiles p
    LEFT JOIN subscriptions s ON s.user_id = p.id
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ============================================================
-- Admin subscription breakdown
-- ============================================================
CREATE OR REPLACE FUNCTION admin_get_subscription_stats()
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

  SELECT json_build_object(
    'active', (SELECT count(*) FROM subscriptions WHERE status = 'active'),
    'canceled', (SELECT count(*) FROM subscriptions WHERE status = 'canceled'),
    'past_due', (SELECT count(*) FROM subscriptions WHERE status = 'past_due'),
    'trialing', (SELECT count(*) FROM subscriptions WHERE status = 'trialing'),
    'cancel_at_period_end', (SELECT count(*) FROM subscriptions WHERE cancel_at_period_end = true AND status = 'active'),
    'total_ever', (SELECT count(*) FROM subscriptions)
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- PART 1: Security — prevent is_admin self-escalation
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_admin_self_promotion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Only allow if the caller is already an admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
      NEW.is_admin := OLD.is_admin;  -- Silently revert
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER protect_admin_flag
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_self_promotion();

-- ============================================================
-- PART 2: Add admin_notes columns
-- ============================================================

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';

-- ============================================================
-- PART 3: Updated RPCs
-- ============================================================

-- Replace admin_list_users: now includes email from auth.users
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
      s.status AS subscription_status,
      s.plan_type,
      s.current_period_end
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    LEFT JOIN subscriptions s ON s.user_id = p.id
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Replace admin_update_ticket_status: now handles status + priority + notes
CREATE OR REPLACE FUNCTION admin_update_ticket(
  p_ticket_id UUID,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
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

  UPDATE support_tickets SET
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = now()
  WHERE id = p_ticket_id;
END;
$$;

-- Replace admin_update_contact_status: now handles status + notes
CREATE OR REPLACE FUNCTION admin_update_contact(
  p_contact_id UUID,
  p_status TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
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

  UPDATE contact_submissions SET
    status = COALESCE(p_status, status),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = now()
  WHERE id = p_contact_id;
END;
$$;

-- Update admin_list_tickets to include admin_notes
CREATE OR REPLACE FUNCTION admin_list_tickets(
  p_status TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
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
    SELECT id, ticket_number, name, email, category, priority, subject, message, admin_notes, status, created_at, updated_at
    FROM support_tickets
    WHERE (p_status IS NULL OR status = p_status)
      AND (p_category IS NULL OR category = p_category)
    ORDER BY
      CASE WHEN status IN ('open', 'in_progress') THEN 0 ELSE 1 END,
      CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
      created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Update admin_list_contacts to include admin_notes
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
    SELECT id, name, email, message, admin_notes, status, created_at, updated_at
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
-- PART 4: New RPCs
-- ============================================================

-- User detail for admin view
CREATE OR REPLACE FUNCTION admin_get_user_detail(p_user_id UUID)
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
    'id', p.id,
    'display_name', p.display_name,
    'email', au.email,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'created_at', p.created_at,
    'stripe_customer_id', p.stripe_customer_id,
    'world_count', (SELECT count(*) FROM worlds w WHERE w.user_id = p.id AND w.archived_at IS NULL),
    'worksheet_count', (SELECT count(*) FROM worksheets ws WHERE ws.user_id = p.id AND ws.archived_at IS NULL),
    'collaborator_count', (SELECT count(*) FROM world_collaborators wc WHERE wc.user_id = p.id),
    'notion_connected', EXISTS(SELECT 1 FROM notion_connections nc WHERE nc.user_id = p.id),
    'subscription', (
      SELECT json_build_object(
        'status', s.status,
        'plan_type', s.plan_type,
        'current_period_end', s.current_period_end,
        'cancel_at_period_end', s.cancel_at_period_end,
        'canceled_at', s.canceled_at,
        'stripe_subscription_id', s.stripe_subscription_id
      )
      FROM subscriptions s WHERE s.user_id = p.id
      ORDER BY s.created_at DESC LIMIT 1
    )
  ) INTO result
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE p.id = p_user_id;

  RETURN result;
END;
$$;

-- Search users by name or email
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
      s.status AS subscription_status,
      s.plan_type,
      s.current_period_end
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    LEFT JOIN subscriptions s ON s.user_id = p.id
    WHERE lower(COALESCE(p.display_name, '')) LIKE search_pattern
       OR lower(COALESCE(au.email, '')) LIKE search_pattern
    ORDER BY p.created_at DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Recent activity feed for overview
CREATE OR REPLACE FUNCTION admin_get_recent_activity(p_limit INT DEFAULT 15)
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
    (
      SELECT 'ticket' AS type,
        subject AS title,
        category AS metadata,
        priority AS extra,
        status,
        created_at
      FROM support_tickets
      ORDER BY created_at DESC
      LIMIT p_limit
    )
    UNION ALL
    (
      SELECT 'contact' AS type,
        name AS title,
        email AS metadata,
        NULL AS extra,
        status,
        created_at
      FROM contact_submissions
      ORDER BY created_at DESC
      LIMIT p_limit
    )
    UNION ALL
    (
      SELECT 'signup' AS type,
        COALESCE(p.display_name, au.email, 'Anonymous') AS title,
        NULL AS metadata,
        NULL AS extra,
        NULL AS status,
        p.created_at
      FROM profiles p
      LEFT JOIN auth.users au ON au.id = p.id
      ORDER BY p.created_at DESC
      LIMIT p_limit
    )
    ORDER BY created_at DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Individual subscriptions list
CREATE OR REPLACE FUNCTION admin_list_subscriptions(
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
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
      s.id,
      s.stripe_subscription_id,
      p.display_name,
      au.email,
      s.plan_type,
      s.status,
      s.current_period_start,
      s.current_period_end,
      s.cancel_at_period_end,
      s.canceled_at,
      s.created_at
    FROM subscriptions s
    JOIN profiles p ON p.id = s.user_id
    LEFT JOIN auth.users au ON au.id = s.user_id
    WHERE (p_status IS NULL OR s.status = p_status)
    ORDER BY s.created_at DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Drop old functions that are being replaced
DROP FUNCTION IF EXISTS admin_update_ticket_status(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_update_contact_status(UUID, TEXT);

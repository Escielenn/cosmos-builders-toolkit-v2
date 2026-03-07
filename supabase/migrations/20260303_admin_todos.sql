-- ============================================================
-- Admin Todo / Task System
-- ============================================================

CREATE TABLE admin_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  linked_ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  linked_contact_id UUID REFERENCES contact_submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_todos ENABLE ROW LEVEL SECURITY;
-- No RLS policies — all access via SECURITY DEFINER RPCs that check is_admin

-- ============================================================
-- RPCs
-- ============================================================

-- 1. List todos
CREATE OR REPLACE FUNCTION admin_list_todos(
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
    SELECT id, title, description, status, priority,
           linked_ticket_id, linked_contact_id,
           created_at, updated_at
    FROM admin_todos
    WHERE (p_status IS NULL OR status = p_status)
    ORDER BY
      CASE status WHEN 'in_progress' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
      CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
      created_at DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 2. Create todo
CREATE OR REPLACE FUNCTION admin_create_todo(
  p_title TEXT,
  p_description TEXT DEFAULT '',
  p_priority TEXT DEFAULT 'normal',
  p_linked_ticket_id UUID DEFAULT NULL,
  p_linked_contact_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
DECLARE new_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO admin_todos (title, description, priority, linked_ticket_id, linked_contact_id)
  VALUES (p_title, p_description, p_priority, p_linked_ticket_id, p_linked_contact_id)
  RETURNING id INTO new_id;

  SELECT json_build_object(
    'id', id, 'title', title, 'description', description,
    'status', status, 'priority', priority,
    'linked_ticket_id', linked_ticket_id,
    'linked_contact_id', linked_contact_id,
    'created_at', created_at, 'updated_at', updated_at
  ) INTO result
  FROM admin_todos WHERE id = new_id;

  RETURN result;
END;
$$;

-- 3. Update todo
CREATE OR REPLACE FUNCTION admin_update_todo(
  p_todo_id UUID,
  p_title TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL
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

  UPDATE admin_todos SET
    title = COALESCE(p_title, title),
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    updated_at = now()
  WHERE id = p_todo_id;
END;
$$;

-- 4. Delete todo
CREATE OR REPLACE FUNCTION admin_delete_todo(p_todo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM admin_todos WHERE id = p_todo_id;
END;
$$;

-- 5. Clear all done todos
CREATE OR REPLACE FUNCTION admin_clear_done_todos()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM admin_todos WHERE status = 'done';
END;
$$;

-- ============================================================
-- Auto-creation triggers
-- ============================================================

-- Auto-create todo from new support ticket
CREATE OR REPLACE FUNCTION auto_todo_from_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_todos (title, priority, linked_ticket_id)
  VALUES (
    '[' || upper(NEW.category) || '] ' || NEW.subject,
    NEW.priority,
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_todo_from_ticket
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_todo_from_ticket();

-- Auto-create todo from new contact submission
CREATE OR REPLACE FUNCTION auto_todo_from_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_todos (title, priority, linked_contact_id)
  VALUES (
    'Contact: ' || NEW.name,
    'normal',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_todo_from_contact
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_todo_from_contact();

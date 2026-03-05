-- ============================================================
-- FIX: entity_worksheets RLS policies
-- Previous policies had critical gaps:
--   1. SELECT didn't check world access (any auth user could query all rows)
--   2. INSERT/DELETE only checked created_by, not world collaborators
--   3. No UPDATE policy
-- Now follows owner+collaborator pattern from world_connections.
-- ============================================================

-- Drop existing broken policies
DROP POLICY IF EXISTS select_entity_worksheets ON entity_worksheets;
DROP POLICY IF EXISTS insert_entity_worksheets ON entity_worksheets;
DROP POLICY IF EXISTS delete_entity_worksheets ON entity_worksheets;

-- SELECT: world owner or any collaborator
CREATE POLICY "Owner can view entity worksheets"
  ON entity_worksheets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM world_entries we
      JOIN worlds w ON w.id = we.world_id
      WHERE we.id = entity_worksheets.entity_id
        AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Collaborators can view entity worksheets"
  ON entity_worksheets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM world_entries we
      JOIN world_collaborators wc ON wc.world_id = we.world_id
      WHERE we.id = entity_worksheets.entity_id
        AND wc.user_id = (select auth.uid())
    )
  );

-- INSERT: world owner or editor collaborator
CREATE POLICY "Owner can insert entity worksheets"
  ON entity_worksheets FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM world_entries we
      JOIN worlds w ON w.id = we.world_id
      WHERE we.id = entity_worksheets.entity_id
        AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Editors can insert entity worksheets"
  ON entity_worksheets FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM world_entries we
      JOIN world_collaborators wc ON wc.world_id = we.world_id
      WHERE we.id = entity_worksheets.entity_id
        AND wc.user_id = (select auth.uid())
        AND wc.role = 'editor'
    )
  );

-- UPDATE: world owner or editor collaborator
CREATE POLICY "Owner can update entity worksheets"
  ON entity_worksheets FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM world_entries we
      JOIN worlds w ON w.id = we.world_id
      WHERE we.id = entity_worksheets.entity_id
        AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Editors can update entity worksheets"
  ON entity_worksheets FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM world_entries we
      JOIN world_collaborators wc ON wc.world_id = we.world_id
      WHERE we.id = entity_worksheets.entity_id
        AND wc.user_id = (select auth.uid())
        AND wc.role = 'editor'
    )
  );

-- DELETE: world owner or editor collaborator
CREATE POLICY "Owner can delete entity worksheets"
  ON entity_worksheets FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM world_entries we
      JOIN worlds w ON w.id = we.world_id
      WHERE we.id = entity_worksheets.entity_id
        AND w.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Editors can delete entity worksheets"
  ON entity_worksheets FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM world_entries we
      JOIN world_collaborators wc ON wc.world_id = we.world_id
      WHERE we.id = entity_worksheets.entity_id
        AND wc.user_id = (select auth.uid())
        AND wc.role = 'editor'
    )
  );

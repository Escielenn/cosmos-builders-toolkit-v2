-- Add title, tags, sort_order to world_notes for multiple named notes per world
ALTER TABLE world_notes ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled Note';
ALTER TABLE world_notes ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE world_notes ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Drop unique constraint on (world_id, user_id) if it exists, to allow multiple notes per world
-- The original table may have been created with a unique constraint or just relied on .maybeSingle()
DO $$
BEGIN
  -- Drop any unique index on (world_id, user_id) if present
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'world_notes'
    AND indexdef LIKE '%world_id%'
    AND indexdef LIKE '%user_id%'
    AND indexdef LIKE '%UNIQUE%'
  ) THEN
    EXECUTE (
      SELECT 'DROP INDEX ' || indexname
      FROM pg_indexes
      WHERE tablename = 'world_notes'
      AND indexdef LIKE '%world_id%'
      AND indexdef LIKE '%user_id%'
      AND indexdef LIKE '%UNIQUE%'
      LIMIT 1
    );
  END IF;
END $$;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_world_notes_world_sort ON world_notes(world_id, sort_order);

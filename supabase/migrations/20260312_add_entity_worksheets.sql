-- Join table linking entity entries to worksheets (many-to-many)
CREATE TABLE IF NOT EXISTS entity_worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES world_entries(id) ON DELETE CASCADE,
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, worksheet_id)
);

-- RLS
ALTER TABLE entity_worksheets ENABLE ROW LEVEL SECURITY;

-- Select: anyone who can see the world_entry can see its worksheet links
CREATE POLICY select_entity_worksheets ON entity_worksheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM world_entries we
      WHERE we.id = entity_worksheets.entity_id
    )
  );

-- Insert: only the entry creator or world editors
CREATE POLICY insert_entity_worksheets ON entity_worksheets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM world_entries we
      WHERE we.id = entity_worksheets.entity_id
        AND we.created_by = auth.uid()
    )
  );

-- Delete: same as insert
CREATE POLICY delete_entity_worksheets ON entity_worksheets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM world_entries we
      WHERE we.id = entity_worksheets.entity_id
        AND we.created_by = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_entity_worksheets_entity ON entity_worksheets(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_worksheets_worksheet ON entity_worksheets(worksheet_id);

-- Backfill: link existing worksheet-sourced entries to their worksheets
INSERT INTO entity_worksheets (entity_id, worksheet_id, is_primary)
SELECT we.id, we.tool_data_id, true
FROM world_entries we
WHERE we.tool_data_id IS NOT NULL
ON CONFLICT (entity_id, worksheet_id) DO NOTHING;

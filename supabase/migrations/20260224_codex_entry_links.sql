-- Phase 3 Revision: Link world_entries to tool data for Codex sidebar
-- Enables draft wiki pages linked to worksheets

-- New columns on world_entries
ALTER TABLE world_entries ADD COLUMN tool_source TEXT;
ALTER TABLE world_entries ADD COLUMN tool_data_id UUID REFERENCES worksheets(id) ON DELETE SET NULL;
ALTER TABLE world_entries ADD COLUMN layer TEXT;

-- Indexes for lookup performance
CREATE INDEX idx_world_entries_tool_data ON world_entries(tool_data_id);
CREATE INDEX idx_world_entries_layer ON world_entries(layer);

-- One entry per tool data row per world (partial unique index)
CREATE UNIQUE INDEX idx_world_entries_tool_link
  ON world_entries(world_id, tool_source, tool_data_id)
  WHERE tool_data_id IS NOT NULL;

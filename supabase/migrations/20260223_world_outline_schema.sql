-- Phase 3: World Outline System schema changes
-- Adds tree hierarchy to world_entries and flexible connections

-- 1. Tree hierarchy for freeform view
ALTER TABLE world_entries ADD COLUMN parent_id UUID REFERENCES world_entries(id) ON DELETE CASCADE;
ALTER TABLE world_entries ADD COLUMN icon TEXT;
ALTER TABLE world_entries ADD COLUMN color TEXT;
CREATE INDEX idx_world_entries_parent ON world_entries(parent_id);

-- 2. Flexible connections: allow entry-to-entry and entry-to-worksheet connections
-- Make existing worksheet FK columns nullable
ALTER TABLE world_connections ALTER COLUMN source_worksheet_id DROP NOT NULL;
ALTER TABLE world_connections ALTER COLUMN target_worksheet_id DROP NOT NULL;

-- Add entry FK columns
ALTER TABLE world_connections ADD COLUMN source_entry_id UUID REFERENCES world_entries(id) ON DELETE CASCADE;
ALTER TABLE world_connections ADD COLUMN target_entry_id UUID REFERENCES world_entries(id) ON DELETE CASCADE;

-- Ensure every connection has exactly one source and one target
ALTER TABLE world_connections ADD CONSTRAINT connection_has_source
  CHECK (source_worksheet_id IS NOT NULL OR source_entry_id IS NOT NULL);
ALTER TABLE world_connections ADD CONSTRAINT connection_has_target
  CHECK (target_worksheet_id IS NOT NULL OR target_entry_id IS NOT NULL);

-- Index for entry-based connection lookups
CREATE INDEX idx_world_connections_source_entry ON world_connections(source_entry_id) WHERE source_entry_id IS NOT NULL;
CREATE INDEX idx_world_connections_target_entry ON world_connections(target_entry_id) WHERE target_entry_id IS NOT NULL;

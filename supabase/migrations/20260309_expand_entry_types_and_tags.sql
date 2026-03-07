-- Expand world_entries.entry_type to support semantic worldbuilding types
-- and add tags column for cross-cutting organization.

-- 1. Drop the restrictive CHECK constraint
ALTER TABLE world_entries DROP CONSTRAINT IF EXISTS world_entries_entry_type_check;

-- 2. Add expanded CHECK with all semantic entity types
--    Includes: original types + TOOL_TYPE_MAP values + worldbuilding entity types
ALTER TABLE world_entries ADD CONSTRAINT world_entries_entry_type_check
  CHECK (entry_type IN (
    -- Original types
    'note', 'milestone', 'decision', 'reference', 'lore',
    -- Worldbuilding entity types
    'planet', 'star_system', 'species', 'faction', 'character',
    'technology', 'location', 'artifact', 'vessel', 'language',
    'mythology', 'custom',
    -- Tool-specific output types (from TOOL_TYPE_MAP)
    'chain_reaction', 'habitable_zone', 'axiom', 'gravity_profile',
    'sensory_system', 'interaction_matrix', 'government',
    'expansion_model', 'propulsion', 'time_dilation', 'gravity_sim',
    'timeline', 'signal_profile'
  ));

-- 3. Add tags array column (mirrors worksheets.tags pattern)
ALTER TABLE world_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 4. GIN index for fast tag queries
CREATE INDEX IF NOT EXISTS idx_world_entries_tags ON world_entries USING GIN (tags);

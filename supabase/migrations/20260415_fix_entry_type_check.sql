-- Fix: world_entries.entry_type CHECK constraint was missing 'document'
-- and 'folder' types used by the writing space. Inserts with those types
-- would fail with a CHECK violation.

ALTER TABLE world_entries DROP CONSTRAINT IF EXISTS world_entries_entry_type_check;

ALTER TABLE world_entries ADD CONSTRAINT world_entries_entry_type_check
  CHECK (entry_type IN (
    -- Original types
    'note', 'milestone', 'decision', 'reference', 'lore',
    -- Writing space types
    'document', 'folder',
    -- Worldbuilding entity types
    'planet', 'star_system', 'species', 'faction', 'character',
    'technology', 'location', 'artifact', 'vessel', 'language',
    'mythology', 'custom',
    -- Tool-specific output types
    'chain_reaction', 'habitable_zone', 'axiom', 'gravity_profile',
    'sensory_system', 'interaction_matrix', 'government',
    'expansion_model', 'propulsion', 'time_dilation', 'gravity_sim',
    'timeline', 'signal_profile'
  ));

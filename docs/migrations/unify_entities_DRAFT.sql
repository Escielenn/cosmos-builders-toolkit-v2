-- ============================================================
-- DRAFT MIGRATION: UNIFY ENTITIES (big-bang)
-- Status: DRAFT — DO NOT APPLY WITHOUT REVIEW
-- Author: StellarForge dev session 2026-04-15
--
-- Goal: Consolidate the two parallel entity systems
--   (`world_entries` + `world_connections` vs. `entities` +
--   `entity_connections`) onto the newer `entities` table as
--   the canonical model.
--
-- Scope decision:
--   - MIGRATES: worldbuilding entity types only (planet, species,
--     character, faction, location, technology, artifact, vessel,
--     language, mythology, custom, star_system, and tool-output
--     types like habitable_zone, chain_reaction, etc.)
--   - DOES NOT MIGRATE: writing documents (document/folder) —
--     these stay in world_entries because they are manuscript
--     artifacts, not world concepts. Same for lore/note/milestone/
--     decision/reference which are user jottings.
--
-- Strategy:
--   1. Preserve world_entries.id values as entities.id so all
--      existing FKs (entity_worksheets.entity_id, etc.) keep
--      working without pointer updates.
--   2. Backfill metadata._legacy_source for traceability.
--   3. Convert world_connections rows that link entry-to-entry
--      into entity_connections rows.
--   4. Re-point entity_worksheets FK from world_entries → entities.
--   5. Re-point writing_entry_entities FK similarly.
--   6. Leave world_entries table in place with non-migrated rows
--      (document/folder/note/etc.) intact. We do NOT drop it.
--
-- Safety:
--   - Wrap in BEGIN/COMMIT transaction
--   - Idempotent: uses ON CONFLICT DO NOTHING for the entity
--     backfill, and all DDL is IF NOT EXISTS / IF EXISTS.
--   - Pre-check query (below) tells you exactly what will migrate
--     before you commit.
-- ============================================================


-- ============================================================
-- PRE-CHECK: run this FIRST and review the output
-- ============================================================

-- 1. How many rows per entry_type would migrate?
--
-- SELECT entry_type, COUNT(*) as rows_to_migrate
-- FROM public.world_entries
-- WHERE entry_type IN (
--   'planet', 'star_system', 'species', 'faction', 'character',
--   'technology', 'location', 'artifact', 'vessel', 'language',
--   'mythology', 'custom',
--   'chain_reaction', 'habitable_zone', 'axiom', 'gravity_profile',
--   'sensory_system', 'interaction_matrix', 'government',
--   'expansion_model', 'propulsion', 'time_dilation', 'gravity_sim',
--   'timeline', 'signal_profile'
-- )
-- GROUP BY entry_type
-- ORDER BY rows_to_migrate DESC;

-- 2. How many rows STAY in world_entries (should NOT migrate)?
--
-- SELECT entry_type, COUNT(*) as rows_staying
-- FROM public.world_entries
-- WHERE entry_type IN (
--   'note', 'milestone', 'decision', 'reference', 'lore',
--   'document', 'folder'
-- )
-- GROUP BY entry_type;

-- 3. Check for ID collisions (should return 0 rows)
--
-- SELECT e.id
-- FROM public.world_entries we
-- JOIN public.entities e ON we.id = e.id;


-- ============================================================
-- MIGRATION BEGINS
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: Map entry_type → (entity_type, cascade_stage)
-- Tool-output types (habitable_zone, chain_reaction, etc.) are
-- coerced to 'custom' with custom_type_label preserved, since
-- the entities table's entity_type CHECK list is narrower.
-- Adjust this mapping if you want tool outputs to map to more
-- specific entity_types.
-- ============================================================

-- Temporary helper mapping table (dropped at end of migration)
CREATE TEMP TABLE _entry_type_map (
  entry_type TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  cascade_stage TEXT NOT NULL,
  use_custom_label BOOLEAN DEFAULT false
);

INSERT INTO _entry_type_map VALUES
  -- Direct 1:1 mappings (these entity_types already exist in entities table)
  ('planet',        'planet',     'environment', false),
  ('star_system',   'star',       'physics',     false),  -- star_system → closest is 'star'
  ('species',       'species',    'biology',     false),
  ('faction',       'faction',    'culture',     false),
  ('character',     'character',  'culture',     false),
  ('technology',    'technology', 'culture',     false),
  ('location',      'location',   'environment', false),
  ('artifact',      'artifact',   'culture',     false),
  ('vessel',        'vessel',     'culture',     false),  -- first-class type (entities.entity_type has no CHECK constraint)
  ('language',      'language',   'culture',     false),
  ('mythology',     'religion',   'mythology',   false),  -- mythology is religion (per user decision)
  ('custom',        'custom',     'culture',     false),
  -- Tool-output types → custom entity with label
  ('chain_reaction',     'custom', 'environment', true),
  ('habitable_zone',     'custom', 'physics',     true),
  ('axiom',              'custom', 'physics',     true),
  ('gravity_profile',    'custom', 'physics',     true),
  ('sensory_system',     'custom', 'biology',     true),
  ('interaction_matrix', 'custom', 'biology',     true),
  ('government',         'custom', 'culture',     true),
  ('expansion_model',    'custom', 'culture',     true),
  ('propulsion',         'custom', 'culture',     true),
  ('time_dilation',      'custom', 'physics',     true),
  ('gravity_sim',        'custom', 'physics',     true),
  ('timeline',           'custom', 'culture',     true),
  ('signal_profile',     'custom', 'culture',     true);


-- ============================================================
-- STEP 2: Backfill entities from world_entries
-- Preserve original IDs so existing FKs keep working.
-- ============================================================

INSERT INTO public.entities (
  id, world_id, user_id, name, entity_type, custom_type_label,
  cascade_stage, color, icon, description, notes,
  parent_entity_id, sort_order, tags, metadata,
  created_at, updated_at
)
SELECT
  we.id,
  we.world_id,
  we.created_by AS user_id,
  we.title AS name,
  m.entity_type,
  CASE WHEN m.use_custom_label THEN we.entry_type ELSE NULL END AS custom_type_label,
  m.cascade_stage,
  we.color,
  we.icon,
  we.content AS description,
  NULL AS notes,
  we.parent_id AS parent_entity_id,
  we.sort_order,
  COALESCE(we.tags, '{}') AS tags,
  jsonb_build_object(
    '_legacy_source', jsonb_build_object(
      'table', 'world_entries',
      'entry_type', we.entry_type,
      'tool_source', we.metadata->>'tool_source',
      'tool_data_id', we.metadata->>'tool_data_id',
      'migrated_at', now()
    )
  ) || COALESCE(we.metadata, '{}') AS metadata,
  we.created_at,
  we.updated_at
FROM public.world_entries we
JOIN _entry_type_map m ON m.entry_type = we.entry_type
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- STEP 3: Migrate entry-to-entry connections into entity_connections
-- Only migrates rows where BOTH source_entry_id and target_entry_id
-- refer to entries we just migrated. Worksheet-linked connections
-- stay in world_connections (for now — they'll be converted later
-- when we migrate entity_worksheets further).
-- ============================================================

INSERT INTO public.entity_connections (
  world_id, user_id, source_entity_id, target_entity_id,
  relationship_type, relationship_label, cascade_stage,
  bidirectional, strength, status,
  notes, metadata, created_at, updated_at
)
SELECT
  wc.world_id,
  wc.created_by AS user_id,
  wc.source_entry_id,
  wc.target_entry_id,
  COALESCE(wc.connection_type, 'references') AS relationship_type,
  wc.connection_type AS relationship_label,
  'cross_cascade' AS cascade_stage,  -- default; can be refined later
  false AS bidirectional,
  5 AS strength,
  'active' AS status,
  wc.description AS notes,
  jsonb_build_object(
    '_legacy_source', jsonb_build_object(
      'table', 'world_connections',
      'migrated_at', now()
    )
  ) AS metadata,
  wc.created_at,
  wc.updated_at
FROM public.world_connections wc
WHERE wc.source_entry_id IS NOT NULL
  AND wc.target_entry_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.entities e WHERE e.id = wc.source_entry_id)
  AND EXISTS (SELECT 1 FROM public.entities e WHERE e.id = wc.target_entry_id)
ON CONFLICT (world_id, source_entity_id, target_entity_id, relationship_type)
DO NOTHING;


-- ============================================================
-- STEP 4: Re-point entity_worksheets FK from world_entries → entities
-- Because we preserved IDs in step 2, all existing entity_worksheets
-- rows already point at valid entities.id values (for the entity-like
-- entries). Any row whose entity_id doesn't exist in entities is an
-- orphan (was pointing at a document/folder) and gets deleted.
-- ============================================================

-- Drop orphaned rows (pointing at docs/folders/notes)
DELETE FROM public.entity_worksheets
WHERE entity_id NOT IN (SELECT id FROM public.entities);

-- Re-point the FK
ALTER TABLE public.entity_worksheets
  DROP CONSTRAINT IF EXISTS entity_worksheets_entity_id_fkey;

ALTER TABLE public.entity_worksheets
  ADD CONSTRAINT entity_worksheets_entity_id_fkey
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;

-- Update RLS policies that joined against world_entries
DROP POLICY IF EXISTS insert_entity_worksheets ON public.entity_worksheets;
CREATE POLICY insert_entity_worksheets ON public.entity_worksheets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_worksheets.entity_id
        AND (e.user_id = auth.uid()
             OR e.world_id IN (
               SELECT world_id FROM public.world_collaborators
               WHERE user_id = auth.uid() AND role = 'editor'
             ))
    )
  );

DROP POLICY IF EXISTS delete_entity_worksheets ON public.entity_worksheets;
CREATE POLICY delete_entity_worksheets ON public.entity_worksheets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_worksheets.entity_id
        AND (e.user_id = auth.uid()
             OR e.world_id IN (
               SELECT world_id FROM public.world_collaborators
               WHERE user_id = auth.uid() AND role = 'editor'
             ))
    )
  );

DROP POLICY IF EXISTS select_entity_worksheets ON public.entity_worksheets;
CREATE POLICY select_entity_worksheets ON public.entity_worksheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_worksheets.entity_id
    )
  );


-- ============================================================
-- STEP 5: Re-point writing_entry_entities FK
-- Writing entries (prompt responses in writing_entries table) can
-- link to entities. Re-point the FK, drop orphans first.
-- ============================================================

DELETE FROM public.writing_entry_entities
WHERE entity_id NOT IN (SELECT id FROM public.entities);

ALTER TABLE public.writing_entry_entities
  DROP CONSTRAINT IF EXISTS writing_entry_entities_entity_id_fkey;

ALTER TABLE public.writing_entry_entities
  ADD CONSTRAINT writing_entry_entities_entity_id_fkey
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;


-- ============================================================
-- STEP 6: Sanity checks inside the transaction
-- If any of these fail, the transaction will abort.
-- ============================================================

DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- Check entity_worksheets integrity
  SELECT COUNT(*) INTO orphan_count
  FROM public.entity_worksheets ew
  LEFT JOIN public.entities e ON e.id = ew.entity_id
  WHERE e.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'entity_worksheets has % orphans after migration', orphan_count;
  END IF;

  -- Check writing_entry_entities integrity
  SELECT COUNT(*) INTO orphan_count
  FROM public.writing_entry_entities wee
  LEFT JOIN public.entities e ON e.id = wee.entity_id
  WHERE e.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'writing_entry_entities has % orphans after migration', orphan_count;
  END IF;
END $$;


-- ============================================================
-- Clean up temp mapping
-- ============================================================
DROP TABLE _entry_type_map;


COMMIT;


-- ============================================================
-- POST-MIGRATION VERIFICATION
-- Run these AFTER the migration to verify success
-- ============================================================

-- A. Row count check: should equal the pre-check "rows_to_migrate" count
--
-- SELECT COUNT(*) FROM public.entities
-- WHERE metadata->'_legacy_source'->>'table' = 'world_entries';

-- B. Spot-check a known entity (replace UUID with a real one you know)
--
-- SELECT e.id, e.name, e.entity_type, e.cascade_stage,
--        e.metadata->'_legacy_source' AS legacy_source
-- FROM public.entities e
-- WHERE e.metadata->'_legacy_source'->>'entry_type' = 'planet'
-- LIMIT 5;

-- C. Confirm entity_worksheets integrity
--
-- SELECT COUNT(*) AS total,
--        COUNT(e.id) AS valid,
--        COUNT(*) - COUNT(e.id) AS orphans
-- FROM public.entity_worksheets ew
-- LEFT JOIN public.entities e ON e.id = ew.entity_id;


-- ============================================================
-- ROLLBACK NOTES
-- This migration is NOT designed for automated rollback.
--
-- If something goes wrong AFTER commit, manual recovery:
--   1. The original world_entries rows are untouched; they
--      still exist.
--   2. DELETE FROM entities WHERE metadata->'_legacy_source'->>'table' = 'world_entries';
--      (removes the migrated copies)
--   3. DELETE FROM entity_connections WHERE metadata->'_legacy_source'->>'table' = 'world_connections';
--   4. Revert the FK changes on entity_worksheets + writing_entry_entities
--      back to referencing world_entries(id).
--
-- RECOMMEND: take a Supabase backup / snapshot BEFORE running.
-- ============================================================

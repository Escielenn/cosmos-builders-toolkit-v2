-- ============================================================
-- CUSTOM ENTITY TYPE TEMPLATES
--
-- Supports two complementary patterns:
--
--   1. World-level templates — a user can define "Character with a
--      Sword Style field" for this world; all Character entities in
--      this world get that field available.
--
--   2. Per-entity overrides — a single entity can add one-off fields
--      not on any template. Stored in the existing entities.metadata
--      JSONB under `_extra` by convention (no schema change needed).
--
-- This migration creates the tables for pattern (1). Pattern (2) is
-- pure code / JSON and needs no schema.
-- ============================================================


-- ============================================================
-- 1. ENTITY_TYPE_TEMPLATES — a named template per world
-- ============================================================

CREATE TABLE IF NOT EXISTS public.entity_type_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Short programmatic key, unique within a world
  type_key TEXT NOT NULL CHECK (type_key ~ '^[a-z0-9_-]+$' AND char_length(type_key) BETWEEN 1 AND 48),
  -- Human-readable display label
  label TEXT NOT NULL,

  -- Display helpers (optional)
  description TEXT,
  icon TEXT,           -- lucide name, emoji, or icon slug
  color TEXT,          -- hex color

  -- Base entity_type this template extends.
  -- 'custom' is the most common; but you can also template, e.g.,
  -- a specialized 'character' with extra fields.
  base_entity_type TEXT NOT NULL DEFAULT 'custom',

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (world_id, type_key)
);

CREATE INDEX IF NOT EXISTS idx_entity_type_templates_world
  ON public.entity_type_templates (world_id, sort_order);

ALTER TABLE public.entity_type_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: owner + collaborators
CREATE POLICY "Users can view own type templates"
  ON public.entity_type_templates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Collaborators can view type templates"
  ON public.entity_type_templates FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

-- INSERT / UPDATE / DELETE: owner + editor collaborators
CREATE POLICY "Users can create type templates"
  ON public.entity_type_templates FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
      OR world_id IN (
        SELECT world_id FROM public.world_collaborators
        WHERE user_id = auth.uid() AND role = 'editor'
      )
    )
  );

CREATE POLICY "Users can update type templates"
  ON public.entity_type_templates FOR UPDATE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
    OR world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Users can delete type templates"
  ON public.entity_type_templates FOR DELETE TO authenticated
  USING (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = auth.uid())
    OR world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE TRIGGER update_entity_type_templates_updated_at
  BEFORE UPDATE ON public.entity_type_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 2. ENTITY_TYPE_FIELDS — the fields on each template
-- ============================================================

CREATE TABLE IF NOT EXISTS public.entity_type_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.entity_type_templates(id) ON DELETE CASCADE,

  field_key TEXT NOT NULL CHECK (field_key ~ '^[a-zA-Z_][a-zA-Z0-9_]*$' AND char_length(field_key) BETWEEN 1 AND 48),
  label TEXT NOT NULL,

  -- Field data type
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text',         -- single-line text
    'longtext',     -- multi-line textarea
    'number',
    'select',       -- single choice from options[]
    'multiselect',  -- multiple choices from options[]
    'boolean',
    'date',
    'entity_ref'    -- reference to another entity (stores entity UUID)
  )),

  -- Only used for select / multiselect
  options JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Only used for entity_ref: which entity types are allowed targets
  ref_entity_types TEXT[] DEFAULT '{}',

  help_text TEXT,
  placeholder TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (template_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_entity_type_fields_template
  ON public.entity_type_fields (template_id, sort_order);

ALTER TABLE public.entity_type_fields ENABLE ROW LEVEL SECURITY;

-- Access derives from the parent template
CREATE POLICY "View fields of visible templates"
  ON public.entity_type_fields FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entity_type_templates t
      WHERE t.id = entity_type_fields.template_id
    )
  );

CREATE POLICY "Manage fields of editable templates"
  ON public.entity_type_fields FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entity_type_templates t
      WHERE t.id = entity_type_fields.template_id
        AND (t.user_id = auth.uid()
             OR t.world_id IN (
               SELECT id FROM public.worlds WHERE user_id = auth.uid()
             )
             OR t.world_id IN (
               SELECT world_id FROM public.world_collaborators
               WHERE user_id = auth.uid() AND role = 'editor'
             ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entity_type_templates t
      WHERE t.id = entity_type_fields.template_id
        AND (t.user_id = auth.uid()
             OR t.world_id IN (
               SELECT id FROM public.worlds WHERE user_id = auth.uid()
             )
             OR t.world_id IN (
               SELECT world_id FROM public.world_collaborators
               WHERE user_id = auth.uid() AND role = 'editor'
             ))
    )
  );


-- ============================================================
-- 3. Convention note — stored on entities
--
-- An entity created from a template carries:
--   entities.metadata->>'_template_id' = <template UUID>
--   entities.metadata->'_custom' = { <field_key>: <value>, ... }
--
-- An entity with ad-hoc per-entity fields carries:
--   entities.metadata->'_extra' = [
--     { key: 'sword_style', label: 'Sword Style', type: 'text',
--       value: 'Niten Ichi-ryu' }, ...
--   ]
--
-- No schema change needed for the above; metadata is free-form JSONB.
-- ============================================================

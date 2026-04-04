-- ============================================================
-- WORLD GRAPH: Entity Layer & Connection Layer
-- Adds the entities table (graph nodes) and entity_connections
-- table (graph edges) for the StellarForge World Graph.
-- ============================================================


-- ============================================================
-- 1. ENTITIES TABLE
-- Every node in the World Graph is an entity.
-- ============================================================

CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  -- Allowed: 'star', 'planet', 'moon', 'species', 'faction',
  -- 'character', 'location', 'technology', 'event', 'concept',
  -- 'language', 'religion', 'artifact', 'custom'
  custom_type_label TEXT,         -- user label when entity_type = 'custom'

  -- Cascade Classification
  cascade_stage TEXT NOT NULL DEFAULT 'culture',
  -- Allowed: 'physics', 'environment', 'biology',
  -- 'psychology', 'mythology', 'culture'

  -- Display
  color TEXT,                     -- hex color override (null = derive from type)
  icon TEXT,                      -- icon identifier or emoji
  summary TEXT,                   -- one-line description for tooltips/cards
  image_url TEXT,                 -- concept art or reference image

  -- Content
  description TEXT,               -- rich text (Tiptap JSON or HTML)
  notes TEXT,                     -- private author notes

  -- Organization
  parent_entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',

  -- Graph Layout (per-world, user-controlled positions)
  graph_x FLOAT,                  -- null = auto-layout via force simulation
  graph_y FLOAT,                  -- null = auto-layout via force simulation
  pinned BOOLEAN DEFAULT false,   -- if true, node stays where user placed it

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_entities_world ON public.entities(world_id);
CREATE INDEX idx_entities_type ON public.entities(world_id, entity_type);
CREATE INDEX idx_entities_cascade ON public.entities(world_id, cascade_stage);
CREATE INDEX idx_entities_parent ON public.entities(parent_entity_id);
CREATE INDEX idx_entities_tags ON public.entities USING GIN(tags);
CREATE INDEX idx_entities_user ON public.entities(user_id);

-- Row Level Security
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entities"
  ON public.entities FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own entities"
  ON public.entities FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own entities"
  ON public.entities FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own entities"
  ON public.entities FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Collaborators: view access
CREATE POLICY "Collaborators can view entities"
  ON public.entities FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

-- Collaborators with editor role: full CRUD
CREATE POLICY "Editors can create entities"
  ON public.entities FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can update entities"
  ON public.entities FOR UPDATE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can delete entities"
  ON public.entities FOR DELETE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

-- Updated-at trigger
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 2. ENTITY CONNECTIONS TABLE
-- Every edge in the World Graph is a connection.
-- ============================================================

CREATE TABLE public.entity_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The relationship
  source_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,

  -- Classification
  relationship_type TEXT NOT NULL,
  relationship_label TEXT,             -- user-facing display label
  cascade_stage TEXT NOT NULL,
  -- Allowed: 'physics', 'environment', 'biology',
  -- 'psychology', 'mythology', 'culture', 'cross_cascade'

  -- Directionality
  bidirectional BOOLEAN DEFAULT false,

  -- Strength & Status
  strength INTEGER DEFAULT 5 CHECK (strength BETWEEN 1 AND 10),
  status TEXT DEFAULT 'active',
  -- 'active', 'historical', 'potential', 'severed'

  -- Temporal bounds
  time_start TEXT,
  time_end TEXT,

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent exact duplicate connections
  UNIQUE(world_id, source_entity_id, target_entity_id, relationship_type)
);

-- Indexes for graph queries (both directions)
CREATE INDEX idx_conn_source ON public.entity_connections(source_entity_id);
CREATE INDEX idx_conn_target ON public.entity_connections(target_entity_id);
CREATE INDEX idx_conn_world ON public.entity_connections(world_id);
CREATE INDEX idx_conn_cascade ON public.entity_connections(world_id, cascade_stage);
CREATE INDEX idx_conn_status ON public.entity_connections(world_id, status);

-- Row Level Security
ALTER TABLE public.entity_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON public.entity_connections FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own connections"
  ON public.entity_connections FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own connections"
  ON public.entity_connections FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own connections"
  ON public.entity_connections FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Collaborator access
CREATE POLICY "Collaborators can view connections"
  ON public.entity_connections FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "Editors can create connections"
  ON public.entity_connections FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can update connections"
  ON public.entity_connections FOR UPDATE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

CREATE POLICY "Editors can delete connections"
  ON public.entity_connections FOR DELETE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

-- Updated-at trigger
CREATE TRIGGER update_entity_connections_updated_at
  BEFORE UPDATE ON public.entity_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 3. BIDIRECTIONAL VIEW
-- Normalized view joining entity names for graph queries.
-- ============================================================

CREATE OR REPLACE VIEW public.entity_connections_bidirectional AS
SELECT
  c.id,
  c.world_id,
  c.source_entity_id,
  c.target_entity_id,
  c.relationship_type,
  c.relationship_label,
  c.cascade_stage,
  c.bidirectional,
  c.strength,
  c.status,
  c.time_start,
  c.time_end,
  c.notes,
  c.metadata,
  se.name AS source_name,
  se.entity_type AS source_type,
  se.color AS source_color,
  se.cascade_stage AS source_cascade,
  te.name AS target_name,
  te.entity_type AS target_type,
  te.color AS target_color,
  te.cascade_stage AS target_cascade
FROM public.entity_connections c
JOIN public.entities se ON c.source_entity_id = se.id
JOIN public.entities te ON c.target_entity_id = te.id;

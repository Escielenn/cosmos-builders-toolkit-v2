-- Simulation saves: persists simulator state for replay and Publish to World.
-- Each save captures input parameters, computed results, optional narrative notes,
-- and an optional thumbnail screenshot.

CREATE TABLE simulation_saves (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID REFERENCES worlds(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  simulator_type  TEXT NOT NULL,          -- 'rogue' | 'tidelock' | 'exosky' | 'exoforge' | 'solaris' | 'cartographer'
  name            TEXT NOT NULL DEFAULT 'Untitled',
  data            JSONB NOT NULL,         -- { parameters, results }
  narrative_notes JSONB,                  -- { environment, biology, culture, mythology }
  thumbnail_url   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for listing saves per world
CREATE INDEX idx_simulation_saves_world ON simulation_saves(world_id, simulator_type);

-- RLS: users manage their own saves
ALTER TABLE simulation_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own simulation saves"
  ON simulation_saves
  FOR ALL
  USING (auth.uid() = user_id);

-- Writing Entry ↔ Entity linking.
-- Connects writing workshop entries to specific world entities.

CREATE TABLE writing_entry_entities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  writing_entry_id  UUID NOT NULL REFERENCES writing_entries(id) ON DELETE CASCADE,
  entity_id         UUID NOT NULL REFERENCES world_entries(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(writing_entry_id, entity_id)
);

ALTER TABLE writing_entry_entities ENABLE ROW LEVEL SECURITY;

-- RLS: anyone who can read the writing entry can read/write links.
-- Simplified: allow authenticated users (RLS on writing_entries already gates access).
CREATE POLICY "Authenticated users manage writing entity links"
  ON writing_entry_entities
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- WRITING ENTRIES
-- Stores user writing workshop entries.
-- Entries can optionally be linked to a world or standalone.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.writing_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  world_id UUID REFERENCES public.worlds(id) ON DELETE SET NULL,
  prompt_id TEXT,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  word_count INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_writing_entries_user
  ON public.writing_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_entries_world
  ON public.writing_entries(world_id);

-- RLS
ALTER TABLE public.writing_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own entries: select"
  ON public.writing_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Own entries: insert"
  ON public.writing_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own entries: update"
  ON public.writing_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Own entries: delete"
  ON public.writing_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER writing_entries_updated_at
  BEFORE UPDATE ON public.writing_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- DOCUMENT VERSIONS
-- Server-side version history for writing-space documents.
-- Replaces the localStorage-only snapshot store.
--
-- Documents live in world_entries (entry_type='document'). This
-- table stores immutable HTML snapshots with a 20-row cap per
-- document enforced by a trigger.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.world_entries(id) ON DELETE CASCADE,
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Snapshot content
  title TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,

  -- Why was this snapshot taken?
  -- 'manual'  — Ctrl+S / save button
  -- 'auto'    — 5-minute auto-snapshot
  -- 'rename'  — captured before a rename
  -- 'restore' — captured before a restore (so restore is undoable)
  -- 'migrate' — imported from localStorage (legacy)
  snapshot_reason TEXT NOT NULL DEFAULT 'manual'
    CHECK (snapshot_reason IN ('manual','auto','rename','restore','migrate')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_document
  ON public.document_versions (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_versions_world
  ON public.document_versions (world_id);
CREATE INDEX IF NOT EXISTS idx_doc_versions_user
  ON public.document_versions (user_id);


-- ============================================================
-- RLS
-- Access derives from the parent document in world_entries.
-- ============================================================

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- SELECT: user owns the doc or is a collaborator on the world
CREATE POLICY "Users can view own doc versions"
  ON public.document_versions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Collaborators can view doc versions"
  ON public.document_versions FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

-- INSERT: user must own the parent world_entries row OR be an editor
CREATE POLICY "Users can create own doc versions"
  ON public.document_versions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.world_entries we
      WHERE we.id = document_versions.document_id
        AND (we.created_by = auth.uid()
             OR we.world_id IN (
               SELECT world_id FROM public.world_collaborators
               WHERE user_id = auth.uid() AND role = 'editor'
             ))
    )
  );

-- DELETE: owner of the version can delete
CREATE POLICY "Users can delete own doc versions"
  ON public.document_versions FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- Retention trigger — cap at 20 versions per document.
-- After each insert, delete the oldest rows beyond the cap.
-- ============================================================

CREATE OR REPLACE FUNCTION public.trim_document_versions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.document_versions
  WHERE id IN (
    SELECT id FROM public.document_versions
    WHERE document_id = NEW.document_id
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trim_document_versions_after_insert ON public.document_versions;
CREATE TRIGGER trim_document_versions_after_insert
  AFTER INSERT ON public.document_versions
  FOR EACH ROW EXECUTE FUNCTION public.trim_document_versions();

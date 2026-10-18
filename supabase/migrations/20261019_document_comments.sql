-- ============================================================
-- DOCUMENT COMMENTS (1.5 item 20, inline comments)
--
-- Inline comments on a writing document. The ANCHOR lives in the document
-- HTML as a mark (<span data-comment-id="…">, src/components/editor/
-- CommentMark.ts) and never changes the prose text; this table holds the
-- comment itself. Compile and export never read it.
--
--   document_id   the world_entries document the comment is on
--   world_id      its world (denormalised for RLS; must match the document)
--   user_id       the author; always auth.uid() (forced by trigger)
--   author_name   the author's display name at writing time (forced by
--                 trigger from profiles), so collaborators see who wrote it
--                 without reading anyone's profile row
--   body          the comment, 1–4000 characters
--   quote         the anchored words when the comment was made (≤ 500), so
--                 a comment whose words were later deleted still says what
--                 it was about
--   resolved_at / resolved_by   set when resolved; NULL = open
--
-- RLS mirrors world_entries / facts: world owner full access, every
-- collaborator reads, editors write. Nothing granted to anon.
-- Idempotent; re-runnable. NOT applied by the agent that wrote it.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.world_entries(id) ON DELETE CASCADE,
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  body TEXT NOT NULL,
  quote TEXT NOT NULL DEFAULT '',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT document_comments_body_length CHECK (char_length(body) BETWEEN 1 AND 4000),
  CONSTRAINT document_comments_quote_length CHECK (char_length(quote) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_document_comments_document
  ON public.document_comments (document_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_comments_world
  ON public.document_comments (world_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user
  ON public.document_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_resolved_by
  ON public.document_comments (resolved_by)
  WHERE resolved_by IS NOT NULL;

-- ── Author stamp ───────────────────────────────────────────────
-- The client cannot choose who a comment is from or what name it shows.
-- On insert: user_id = the caller, author_name = their display name.
-- On update: author, document and world never change; updated_at moves.

CREATE OR REPLACE FUNCTION public.document_comments_stamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.user_id := v_uid;
    SELECT p.display_name INTO NEW.author_name
      FROM public.profiles p
     WHERE p.id = v_uid;
    NEW.created_at := now();
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.author_name := OLD.author_name;
    NEW.document_id := OLD.document_id;
    NEW.world_id := OLD.world_id;
    NEW.created_at := OLD.created_at;
  END IF;

  IF NEW.resolved_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.resolved_at IS NULL) THEN
    NEW.resolved_by := v_uid;
  ELSIF NEW.resolved_at IS NULL THEN
    NEW.resolved_by := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.document_comments_stamp() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS document_comments_stamp ON public.document_comments;
CREATE TRIGGER document_comments_stamp
  BEFORE INSERT OR UPDATE ON public.document_comments
  FOR EACH ROW EXECUTE FUNCTION public.document_comments_stamp();

-- ── Policies (mirror world_entries) ────────────────────────────

ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "World owner can view document comments" ON public.document_comments;
DROP POLICY IF EXISTS "World owner can create document comments" ON public.document_comments;
DROP POLICY IF EXISTS "World owner can update document comments" ON public.document_comments;
DROP POLICY IF EXISTS "World owner can delete document comments" ON public.document_comments;
DROP POLICY IF EXISTS "Collaborators can view document comments" ON public.document_comments;
DROP POLICY IF EXISTS "Editors can create document comments" ON public.document_comments;
DROP POLICY IF EXISTS "Editors can update document comments" ON public.document_comments;
DROP POLICY IF EXISTS "Editors can delete document comments" ON public.document_comments;

CREATE POLICY "World owner can view document comments"
  ON public.document_comments FOR SELECT TO authenticated
  USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = (SELECT auth.uid())));

-- Inserts also check that the document is a document of that world, so a
-- comment can never be filed against another world's row.
CREATE POLICY "World owner can create document comments"
  ON public.document_comments FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (SELECT id FROM public.worlds WHERE user_id = (SELECT auth.uid()))
    AND document_id IN (
      SELECT e.id FROM public.world_entries e
       WHERE e.world_id = document_comments.world_id AND e.entry_type = 'document'
    )
  );

CREATE POLICY "World owner can update document comments"
  ON public.document_comments FOR UPDATE TO authenticated
  USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (world_id IN (SELECT id FROM public.worlds WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "World owner can delete document comments"
  ON public.document_comments FOR DELETE TO authenticated
  USING (world_id IN (SELECT id FROM public.worlds WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Collaborators can view document comments"
  ON public.document_comments FOR SELECT TO authenticated
  USING (world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Editors can create document comments"
  ON public.document_comments FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
       WHERE user_id = (SELECT auth.uid()) AND role = 'editor'
    )
    AND document_id IN (
      SELECT e.id FROM public.world_entries e
       WHERE e.world_id = document_comments.world_id AND e.entry_type = 'document'
    )
  );

CREATE POLICY "Editors can update document comments"
  ON public.document_comments FOR UPDATE TO authenticated
  USING (world_id IN (
    SELECT world_id FROM public.world_collaborators
     WHERE user_id = (SELECT auth.uid()) AND role = 'editor'
  ))
  WITH CHECK (world_id IN (
    SELECT world_id FROM public.world_collaborators
     WHERE user_id = (SELECT auth.uid()) AND role = 'editor'
  ));

CREATE POLICY "Editors can delete document comments"
  ON public.document_comments FOR DELETE TO authenticated
  USING (world_id IN (
    SELECT world_id FROM public.world_collaborators
     WHERE user_id = (SELECT auth.uid()) AND role = 'editor'
  ));

REVOKE ALL ON public.document_comments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_comments TO authenticated;

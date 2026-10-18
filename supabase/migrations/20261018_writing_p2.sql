-- ============================================================
-- WRITING P2 — Scrivener views (Studio, 2026-10-18)
--
-- Named snapshots are exempt from the 20-row cap.
--
-- 20260415_add_document_versions.sql capped document_versions at
-- 20 rows per document, newest kept, with no regard to what a row
-- was. 20261018_writing_p1.sql added document_versions.name so a
-- writer can name a snapshot ("Before the rewrite"); a named
-- snapshot is the writer saying "keep this", so letting twenty
-- autosaves push it off the end loses exactly the version they
-- asked us to remember.
--
-- New rule: the cap counts and trims UNNAMED rows only (name IS
-- NULL or blank). A named row is never deleted by the trigger;
-- the writer deletes it by hand from the Snaps pane.
--
-- Everything else Phase 2 stores (saved collections, the project
-- target and deadline) lives in worlds.settings, added by P1; no
-- new table or column.
--
-- Idempotent. Depends on 20261018_writing_p1.sql for the name
-- column, but re-adds it IF NOT EXISTS so the order of the two
-- files cannot break the function body.
-- ============================================================

ALTER TABLE public.document_versions
  ADD COLUMN IF NOT EXISTS name TEXT;

CREATE OR REPLACE FUNCTION public.trim_document_versions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.document_versions
  WHERE id IN (
    SELECT id FROM public.document_versions
    WHERE document_id = NEW.document_id
      AND (name IS NULL OR btrim(name) = '')
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


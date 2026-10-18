-- ============================================================
-- WRITING P1 — trust and structure (Studio, 2026-10-18)
--
-- 1. worlds.settings: a small per-world jsonb for writing-space
--    preferences that belong to the world, not the user. First key:
--    writingLabels, the Scrivener-style label set
--    ([{ id, name, hue }], hue one of the named-hue tokens).
--    Existing worlds RLS covers it; no new policy.
--
-- 2. document_versions.name: an optional writer-given snapshot name
--    ("Before the rewrite"). NULL for automatic snapshots.
--
-- 3. document_versions.snapshot_reason gains 'trash' (captured
--    automatically before a document is moved to the trash).
--
-- Idempotent. The client degrades gracefully without it (labels fall
-- back to this browser, names and 'trash' fall back to the old shape).
-- ============================================================

ALTER TABLE public.worlds
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.document_versions
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.document_versions
  DROP CONSTRAINT IF EXISTS document_versions_snapshot_reason_check;

ALTER TABLE public.document_versions
  ADD CONSTRAINT document_versions_snapshot_reason_check
  CHECK (snapshot_reason IN ('manual','auto','rename','restore','migrate','trash'));

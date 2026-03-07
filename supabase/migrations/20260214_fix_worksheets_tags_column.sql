-- The 20260131 migration was marked as applied but the tags column
-- on worksheets was never created on the remote database.
-- This migration ensures the column exists.

ALTER TABLE public.worksheets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_worksheets_tags ON public.worksheets USING GIN (tags);

-- Force PostgREST to reload schema cache so it recognizes the new column
NOTIFY pgrst, 'reload schema';

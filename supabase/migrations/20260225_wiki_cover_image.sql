-- Add cover image URL to world_entries for wiki pages
ALTER TABLE world_entries ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Phase 5: Per-world visual customization
-- Adds a theme JSONB column for accent_color, cover_image_url, icon, font_mood
ALTER TABLE worlds ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}'::jsonb;

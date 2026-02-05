-- Add archived_at column to worlds table
ALTER TABLE public.worlds ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Add archived_at column to worksheets table
ALTER TABLE public.worksheets ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for faster filtering of non-archived items
CREATE INDEX IF NOT EXISTS idx_worlds_archived_at ON public.worlds (archived_at);
CREATE INDEX IF NOT EXISTS idx_worksheets_archived_at ON public.worksheets (archived_at);

-- Add tags column to worlds table (worksheets already has tags from previous migration)
ALTER TABLE public.worlds ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create an index for faster tag searches on worlds
CREATE INDEX IF NOT EXISTS idx_worlds_tags ON public.worlds USING GIN (tags);

-- Create world_tags table for autocomplete (similar to worksheet_tags)
CREATE TABLE IF NOT EXISTS world_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on world_tags
ALTER TABLE world_tags ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tags
CREATE POLICY "Users can view own world tags"
  ON world_tags FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tags
CREATE POLICY "Users can insert own world tags"
  ON world_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tags
CREATE POLICY "Users can update own world tags"
  ON world_tags FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tags
CREATE POLICY "Users can delete own world tags"
  ON world_tags FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update world tag usage count
CREATE OR REPLACE FUNCTION increment_world_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update tag usage
  INSERT INTO world_tags (user_id, name, usage_count)
  SELECT
    NEW.user_id,
    unnest(NEW.tags),
    1
  ON CONFLICT (user_id, name)
  DO UPDATE SET
    usage_count = world_tags.usage_count + 1,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tag usage when worlds are updated
CREATE OR REPLACE TRIGGER update_world_tag_usage
  AFTER INSERT OR UPDATE OF tags ON worlds
  FOR EACH ROW
  WHEN (NEW.tags IS NOT NULL AND array_length(NEW.tags, 1) > 0)
  EXECUTE FUNCTION increment_world_tag_usage();

-- Create storage bucket for moodboard images
INSERT INTO storage.buckets (id, name, public)
VALUES ('moodboard-images', 'moodboard-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for moodboard images
CREATE POLICY "Anyone can view moodboard images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'moodboard-images');

CREATE POLICY "Authenticated users can upload moodboard images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'moodboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own moodboard images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'moodboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own moodboard images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'moodboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

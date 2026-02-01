-- Add tags column to worksheets table
ALTER TABLE worksheets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create an index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_worksheets_tags ON worksheets USING GIN (tags);

-- Optional: Create a table to track commonly used tags for autocomplete
CREATE TABLE IF NOT EXISTS worksheet_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on worksheet_tags
ALTER TABLE worksheet_tags ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tags
CREATE POLICY "Users can view own tags"
  ON worksheet_tags FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tags
CREATE POLICY "Users can insert own tags"
  ON worksheet_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tags
CREATE POLICY "Users can update own tags"
  ON worksheet_tags FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tags
CREATE POLICY "Users can delete own tags"
  ON worksheet_tags FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update tag usage
  INSERT INTO worksheet_tags (user_id, name, usage_count)
  SELECT
    NEW.user_id,
    unnest(NEW.tags),
    1
  ON CONFLICT (user_id, name)
  DO UPDATE SET
    usage_count = worksheet_tags.usage_count + 1,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tag usage when worksheets are updated
CREATE OR REPLACE TRIGGER update_tag_usage
  AFTER INSERT OR UPDATE OF tags ON worksheets
  FOR EACH ROW
  WHEN (NEW.tags IS NOT NULL AND array_length(NEW.tags, 1) > 0)
  EXECUTE FUNCTION increment_tag_usage();

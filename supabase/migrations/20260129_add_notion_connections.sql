-- Add notion_connections table to store OAuth tokens
CREATE TABLE IF NOT EXISTS notion_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  workspace_name TEXT,
  workspace_icon TEXT,
  bot_id TEXT NOT NULL,
  duplicated_template_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One Notion connection per user
);

-- Enable RLS
ALTER TABLE notion_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own connection
CREATE POLICY "Users can view own notion connection"
  ON notion_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notion connection"
  ON notion_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notion connection"
  ON notion_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notion connection"
  ON notion_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS notion_connections_user_id_idx ON notion_connections(user_id);

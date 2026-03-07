-- Badge/Achievement system: stores earned badges per user
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_badges ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_badges ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

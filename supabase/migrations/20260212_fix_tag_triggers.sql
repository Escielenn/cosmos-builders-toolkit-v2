-- Fix tag trigger functions to use SECURITY DEFINER
-- This prevents RLS violations when the trigger inserts into worksheet_tags/world_tags
-- (e.g., when a collaborator updates tags on a shared worksheet)

-- Fix worksheet tag trigger
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update tag usage for each tag in the array
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

-- Fix world tag trigger
CREATE OR REPLACE FUNCTION increment_world_tag_usage()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update tag usage for each tag in the array
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

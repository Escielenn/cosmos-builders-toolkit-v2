-- Add vertical focus point for world header images (0=top, 50=center, 100=bottom)
ALTER TABLE public.worlds
  ADD COLUMN header_image_focus_y SMALLINT NOT NULL DEFAULT 50;

-- Update get_shared_world to include the new field
CREATE OR REPLACE FUNCTION public.get_shared_world(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
  v_world RECORD;
  v_owner RECORD;
  v_worksheets JSON;
  v_result JSON;
BEGIN
  SELECT * INTO v_share
  FROM public.world_link_shares
  WHERE share_token = p_token AND enabled = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.world_link_shares
  SET view_count = view_count + 1
  WHERE id = v_share.id;

  SELECT * INTO v_world
  FROM public.worlds
  WHERE id = v_share.world_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT display_name, avatar_url INTO v_owner
  FROM public.profiles
  WHERE id = v_share.owner_id;

  SELECT json_agg(json_build_object(
    'id', w.id,
    'tool_type', w.tool_type,
    'title', w.title,
    'tags', w.tags,
    'created_at', w.created_at,
    'updated_at', w.updated_at
  ) ORDER BY w.updated_at DESC)
  INTO v_worksheets
  FROM public.worksheets w
  WHERE w.world_id = v_world.id
    AND w.archived_at IS NULL;

  v_result := json_build_object(
    'world_id', v_world.id,
    'name', v_world.name,
    'description', v_world.description,
    'header_image_url', v_world.header_image_url,
    'header_image_focus_y', v_world.header_image_focus_y,
    'icon', v_world.icon,
    'tags', v_world.tags,
    'created_at', v_world.created_at,
    'updated_at', v_world.updated_at,
    'owner_display_name', v_owner.display_name,
    'owner_avatar_url', v_owner.avatar_url,
    'worksheets', COALESCE(v_worksheets, '[]'::json),
    'view_count', v_share.view_count + 1
  );

  RETURN v_result;
END;
$$;

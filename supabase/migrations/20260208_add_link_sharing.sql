-- ============================================================
-- LINK SHARING: Phase 1
-- Enables public read-only link sharing for worksheets and worlds
-- ============================================================

-- Enable pgcrypto for gen_random_bytes()
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. WORKSHEET LINK SHARES TABLE
CREATE TABLE public.worksheet_link_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  enabled BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT worksheet_link_shares_worksheet_unique UNIQUE (worksheet_id),
  CONSTRAINT worksheet_link_shares_token_unique UNIQUE (share_token)
);

CREATE INDEX idx_worksheet_link_shares_owner ON public.worksheet_link_shares (owner_id);
CREATE INDEX idx_worksheet_link_shares_token ON public.worksheet_link_shares (share_token);

ALTER TABLE public.worksheet_link_shares ENABLE ROW LEVEL SECURITY;

-- Owner policies
CREATE POLICY "Owners can view own worksheet shares"
  ON public.worksheet_link_shares FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create worksheet shares"
  ON public.worksheet_link_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own worksheet shares"
  ON public.worksheet_link_shares FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own worksheet shares"
  ON public.worksheet_link_shares FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Anon can verify tokens
CREATE POLICY "Anyone can verify worksheet share token"
  ON public.worksheet_link_shares FOR SELECT TO anon
  USING (enabled = true);

CREATE TRIGGER update_worksheet_link_shares_updated_at
  BEFORE UPDATE ON public.worksheet_link_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 2. WORLD LINK SHARES TABLE
CREATE TABLE public.world_link_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  enabled BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT world_link_shares_world_unique UNIQUE (world_id),
  CONSTRAINT world_link_shares_token_unique UNIQUE (share_token)
);

CREATE INDEX idx_world_link_shares_owner ON public.world_link_shares (owner_id);
CREATE INDEX idx_world_link_shares_token ON public.world_link_shares (share_token);

ALTER TABLE public.world_link_shares ENABLE ROW LEVEL SECURITY;

-- Owner policies
CREATE POLICY "Owners can view own world shares"
  ON public.world_link_shares FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create world shares"
  ON public.world_link_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own world shares"
  ON public.world_link_shares FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own world shares"
  ON public.world_link_shares FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Anon can verify tokens
CREATE POLICY "Anyone can verify world share token"
  ON public.world_link_shares FOR SELECT TO anon
  USING (enabled = true);

CREATE TRIGGER update_world_link_shares_updated_at
  BEFORE UPDATE ON public.world_link_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 3. RPC FUNCTIONS (SECURITY DEFINER to bypass RLS for valid tokens)

CREATE OR REPLACE FUNCTION public.get_shared_worksheet(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
  v_worksheet RECORD;
  v_owner RECORD;
  v_world_name TEXT;
  v_result JSON;
BEGIN
  SELECT * INTO v_share
  FROM public.worksheet_link_shares
  WHERE share_token = p_token AND enabled = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.worksheet_link_shares
  SET view_count = view_count + 1
  WHERE id = v_share.id;

  SELECT * INTO v_worksheet
  FROM public.worksheets
  WHERE id = v_share.worksheet_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT display_name, avatar_url INTO v_owner
  FROM public.profiles
  WHERE id = v_share.owner_id;

  SELECT name INTO v_world_name
  FROM public.worlds
  WHERE id = v_worksheet.world_id;

  v_result := json_build_object(
    'worksheet_id', v_worksheet.id,
    'tool_type', v_worksheet.tool_type,
    'title', v_worksheet.title,
    'data', v_worksheet.data,
    'tags', v_worksheet.tags,
    'created_at', v_worksheet.created_at,
    'updated_at', v_worksheet.updated_at,
    'owner_display_name', v_owner.display_name,
    'owner_avatar_url', v_owner.avatar_url,
    'world_id', v_worksheet.world_id,
    'world_name', v_world_name,
    'view_count', v_share.view_count + 1
  );

  RETURN v_result;
END;
$$;

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

GRANT EXECUTE ON FUNCTION public.get_shared_worksheet(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_worksheet(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_world(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_world(TEXT) TO authenticated;

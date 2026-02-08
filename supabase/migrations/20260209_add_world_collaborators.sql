-- ============================================================
-- COLLABORATOR INVITES: Phase 2
-- Enables inviting collaborators to worlds (Pro feature)
-- ============================================================

-- 1. WORLD COLLABORATORS TABLE (accepted collaborations)
CREATE TABLE public.world_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')) DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT world_collaborators_unique UNIQUE (world_id, user_id)
);

CREATE INDEX idx_world_collaborators_world ON public.world_collaborators (world_id);
CREATE INDEX idx_world_collaborators_user ON public.world_collaborators (user_id);

ALTER TABLE public.world_collaborators ENABLE ROW LEVEL SECURITY;

-- World owner can manage collaborators
CREATE POLICY "World owner can view collaborators"
  ON public.world_collaborators FOR SELECT TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

CREATE POLICY "Collaborators can view own membership"
  ON public.world_collaborators FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "World owner can add collaborators"
  ON public.world_collaborators FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

CREATE POLICY "World owner can update collaborator roles"
  ON public.world_collaborators FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

CREATE POLICY "World owner can remove collaborators"
  ON public.world_collaborators FOR DELETE TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

CREATE POLICY "Collaborators can leave world"
  ON public.world_collaborators FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_world_collaborators_updated_at
  BEFORE UPDATE ON public.world_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 2. WORLD INVITES TABLE (pending invitations)
CREATE TABLE public.world_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')) DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  CONSTRAINT world_invites_token_unique UNIQUE (invite_token)
);

CREATE INDEX idx_world_invites_world ON public.world_invites (world_id);
CREATE INDEX idx_world_invites_email ON public.world_invites (invited_email);
CREATE INDEX idx_world_invites_token ON public.world_invites (invite_token);

ALTER TABLE public.world_invites ENABLE ROW LEVEL SECURITY;

-- World owner can manage invites
CREATE POLICY "World owner can view invites"
  ON public.world_invites FOR SELECT TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

CREATE POLICY "World owner can create invites"
  ON public.world_invites FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

CREATE POLICY "World owner can update invites"
  ON public.world_invites FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

CREATE POLICY "World owner can delete invites"
  ON public.world_invites FOR DELETE TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

CREATE POLICY "Invited users can view own invites"
  ON public.world_invites FOR SELECT TO authenticated
  USING (
    lower(invited_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE TRIGGER update_world_invites_updated_at
  BEFORE UPDATE ON public.world_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 3. RLS POLICIES FOR COLLABORATOR ACCESS TO EXISTING TABLES

-- Collaborators can view shared worlds
CREATE POLICY "Collaborators can view shared worlds"
  ON public.worlds FOR SELECT TO authenticated
  USING (
    id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

-- Collaborators can view worksheets in shared worlds
CREATE POLICY "Collaborators can view shared worksheets"
  ON public.worksheets FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

-- Editors can update worksheets in shared worlds
CREATE POLICY "Editors can update shared worksheets"
  ON public.worksheets FOR UPDATE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

-- Editors can create worksheets in shared worlds
CREATE POLICY "Editors can create worksheets in shared worlds"
  ON public.worksheets FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

-- Collaborators can view world notes
CREATE POLICY "Collaborators can view shared world notes"
  ON public.world_notes FOR SELECT TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = auth.uid())
  );

-- Editors can update world notes
CREATE POLICY "Editors can update shared world notes"
  ON public.world_notes FOR UPDATE TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

-- Editors can create world notes in shared worlds
CREATE POLICY "Editors can create shared world notes"
  ON public.world_notes FOR INSERT TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );


-- 4. RPC FUNCTIONS (SECURITY DEFINER)

-- Lookup user by email (safe: only returns profile info, never email)
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email);

  IF NOT FOUND THEN
    RETURN json_build_object('found', false);
  END IF;

  SELECT id, display_name, avatar_url INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  RETURN json_build_object(
    'found', true,
    'user_id', v_profile.id,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(TEXT) TO authenticated;


-- Accept a world invite (atomic: validate + insert collaborator + mark accepted)
CREATE OR REPLACE FUNCTION public.accept_world_invite(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
  v_existing RECORD;
BEGIN
  -- Get the current user's email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find the pending invite by token
  SELECT * INTO v_invite
  FROM public.world_invites
  WHERE invite_token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invite not found, expired, or already used');
  END IF;

  -- Verify the invite email matches the current user
  IF lower(v_invite.invited_email) != lower(v_user_email) THEN
    RETURN json_build_object('success', false, 'error', 'This invite was sent to a different email address');
  END IF;

  -- Check if already a collaborator
  SELECT * INTO v_existing
  FROM public.world_collaborators
  WHERE world_id = v_invite.world_id AND user_id = auth.uid();

  IF FOUND THEN
    UPDATE public.world_invites SET status = 'accepted' WHERE id = v_invite.id;
    RETURN json_build_object('success', true, 'already_member', true, 'world_id', v_invite.world_id);
  END IF;

  -- Check the user isn't the world owner
  IF auth.uid() IN (SELECT user_id FROM public.worlds WHERE id = v_invite.world_id) THEN
    UPDATE public.world_invites SET status = 'accepted' WHERE id = v_invite.id;
    RETURN json_build_object('success', true, 'is_owner', true, 'world_id', v_invite.world_id);
  END IF;

  -- Insert collaborator row
  INSERT INTO public.world_collaborators (world_id, user_id, role, invited_by)
  VALUES (v_invite.world_id, auth.uid(), v_invite.role, v_invite.invited_by);

  -- Mark invite as accepted
  UPDATE public.world_invites SET status = 'accepted' WHERE id = v_invite.id;

  RETURN json_build_object(
    'success', true,
    'world_id', v_invite.world_id,
    'role', v_invite.role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_world_invite(TEXT) TO authenticated;


-- Get collaborators for a world (with profile info)
CREATE OR REPLACE FUNCTION public.get_collaborators_for_world(p_world_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Verify caller is the world owner or a collaborator
  IF auth.uid() NOT IN (
    SELECT user_id FROM public.worlds WHERE id = p_world_id
    UNION
    SELECT user_id FROM public.world_collaborators WHERE world_id = p_world_id
  ) THEN
    RETURN '[]'::json;
  END IF;

  SELECT json_agg(json_build_object(
    'id', wc.id,
    'user_id', wc.user_id,
    'role', wc.role,
    'created_at', wc.created_at,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url
  ) ORDER BY wc.created_at ASC)
  INTO v_result
  FROM public.world_collaborators wc
  JOIN public.profiles p ON p.id = wc.user_id
  WHERE wc.world_id = p_world_id;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_collaborators_for_world(UUID) TO authenticated;

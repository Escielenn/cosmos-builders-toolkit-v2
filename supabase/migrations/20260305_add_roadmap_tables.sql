-- ============================================================
-- Roadmap Items (admin-managed upcoming tools/features)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'tool'
    CHECK (category IN ('tool', 'feature', 'simulator', 'integration')),
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'beta', 'released')),
  priority_order INT NOT NULL DEFAULT 0,
  vote_count INT NOT NULL DEFAULT 0,
  target_quarter TEXT,         -- e.g. 'Q2 2026'
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read the roadmap
CREATE POLICY "Anyone can view roadmap items"
  ON public.roadmap_items FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can modify roadmap items
CREATE POLICY "Admins can insert roadmap items"
  ON public.roadmap_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update roadmap items"
  ON public.roadmap_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete roadmap items"
  ON public.roadmap_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_roadmap_items_updated_at'
  ) THEN
    CREATE TRIGGER update_roadmap_items_updated_at
      BEFORE UPDATE ON public.roadmap_items
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- ============================================================
-- Roadmap Votes (Vanguard member votes)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roadmap_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roadmap_item_id UUID NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  vote_count INT NOT NULL DEFAULT 1
    CHECK (vote_count > 0),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One allocation per user per item per billing period
  UNIQUE(user_id, roadmap_item_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_votes_user ON public.roadmap_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item ON public.roadmap_votes(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_period ON public.roadmap_votes(period_start, period_end);

ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;

-- Users can view their own votes
CREATE POLICY "Users can view own votes"
  ON public.roadmap_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own votes (RPC enforces Vanguard check)
CREATE POLICY "Users can insert own votes"
  ON public.roadmap_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON public.roadmap_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON public.roadmap_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all votes (for analytics)
CREATE POLICY "Admins can view all votes"
  ON public.roadmap_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_roadmap_votes_updated_at'
  ) THEN
    CREATE TRIGGER update_roadmap_votes_updated_at
      BEFORE UPDATE ON public.roadmap_votes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- ============================================================
-- cast_roadmap_vote RPC
-- Validates Vanguard tier, enforces 10-vote budget per billing period
-- ============================================================

CREATE OR REPLACE FUNCTION public.cast_roadmap_vote(
  p_roadmap_item_id UUID,
  p_vote_count INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_used_votes INT;
  v_max_votes INT := 10;
BEGIN
  -- 1. Verify the user has an active Vanguard subscription
  SELECT tier, current_period_start, current_period_end
  INTO v_sub
  FROM public.subscriptions
  WHERE user_id = auth.uid()
    AND status IN ('active', 'trialing')
    AND tier = 'vanguard'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_sub IS NULL THEN
    RETURN json_build_object('error', 'Vanguard subscription required to vote');
  END IF;

  -- 2. Check the vote doesn't go to a released item
  IF EXISTS (
    SELECT 1 FROM public.roadmap_items
    WHERE id = p_roadmap_item_id AND status = 'released'
  ) THEN
    RETURN json_build_object('error', 'Cannot vote on released items');
  END IF;

  -- 3. Count votes already used in this billing period
  SELECT COALESCE(SUM(vote_count), 0) INTO v_used_votes
  FROM public.roadmap_votes
  WHERE user_id = auth.uid()
    AND period_start = v_sub.current_period_start
    AND period_end = v_sub.current_period_end;

  IF v_used_votes + p_vote_count > v_max_votes THEN
    RETURN json_build_object(
      'error', 'Vote budget exceeded',
      'used', v_used_votes,
      'remaining', v_max_votes - v_used_votes,
      'max', v_max_votes
    );
  END IF;

  -- 4. Upsert the vote (add to existing allocation if already voted on this item)
  INSERT INTO public.roadmap_votes (
    user_id, roadmap_item_id, vote_count, period_start, period_end
  ) VALUES (
    auth.uid(), p_roadmap_item_id, p_vote_count,
    v_sub.current_period_start, v_sub.current_period_end
  )
  ON CONFLICT (user_id, roadmap_item_id, period_start)
  DO UPDATE SET
    vote_count = roadmap_votes.vote_count + p_vote_count,
    updated_at = NOW();

  -- 5. Update denormalized count on roadmap_items
  UPDATE public.roadmap_items
  SET vote_count = (
    SELECT COALESCE(SUM(vote_count), 0)
    FROM public.roadmap_votes
    WHERE roadmap_item_id = p_roadmap_item_id
  )
  WHERE id = p_roadmap_item_id;

  RETURN json_build_object(
    'success', true,
    'used', v_used_votes + p_vote_count,
    'remaining', v_max_votes - v_used_votes - p_vote_count,
    'max', v_max_votes
  );
END;
$$;

-- ============================================================
-- remove_roadmap_vote RPC
-- Remove or reduce vote allocation on an item
-- ============================================================

CREATE OR REPLACE FUNCTION public.remove_roadmap_vote(
  p_roadmap_item_id UUID,
  p_vote_count INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_current_votes INT;
BEGIN
  -- Get current billing period
  SELECT current_period_start, current_period_end
  INTO v_sub
  FROM public.subscriptions
  WHERE user_id = auth.uid()
    AND status IN ('active', 'trialing')
    AND tier = 'vanguard'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_sub IS NULL THEN
    RETURN json_build_object('error', 'Vanguard subscription required');
  END IF;

  -- Get current vote count on this item
  SELECT vote_count INTO v_current_votes
  FROM public.roadmap_votes
  WHERE user_id = auth.uid()
    AND roadmap_item_id = p_roadmap_item_id
    AND period_start = v_sub.current_period_start;

  IF v_current_votes IS NULL OR v_current_votes = 0 THEN
    RETURN json_build_object('error', 'No votes to remove');
  END IF;

  -- Remove or reduce
  IF p_vote_count >= v_current_votes THEN
    -- Delete the entire allocation
    DELETE FROM public.roadmap_votes
    WHERE user_id = auth.uid()
      AND roadmap_item_id = p_roadmap_item_id
      AND period_start = v_sub.current_period_start;
  ELSE
    -- Reduce the allocation
    UPDATE public.roadmap_votes
    SET vote_count = vote_count - p_vote_count, updated_at = NOW()
    WHERE user_id = auth.uid()
      AND roadmap_item_id = p_roadmap_item_id
      AND period_start = v_sub.current_period_start;
  END IF;

  -- Update denormalized count
  UPDATE public.roadmap_items
  SET vote_count = (
    SELECT COALESCE(SUM(vote_count), 0)
    FROM public.roadmap_votes
    WHERE roadmap_item_id = p_roadmap_item_id
  )
  WHERE id = p_roadmap_item_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- Admin RPCs for roadmap management
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_list_roadmap_items(
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(r) INTO result FROM (
    SELECT id, title, description, category, status,
           priority_order, vote_count, target_quarter,
           released_at, created_at, updated_at
    FROM public.roadmap_items
    WHERE (p_status IS NULL OR status = p_status)
    ORDER BY priority_order ASC, vote_count DESC, created_at DESC
    LIMIT p_limit
  ) r;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_roadmap_item(
  p_title TEXT,
  p_description TEXT DEFAULT '',
  p_category TEXT DEFAULT 'tool',
  p_target_quarter TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  new_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.roadmap_items (title, description, category, target_quarter)
  VALUES (p_title, p_description, p_category, p_target_quarter)
  RETURNING id INTO new_id;

  SELECT json_build_object(
    'id', id, 'title', title, 'description', description,
    'category', category, 'status', status,
    'priority_order', priority_order, 'vote_count', vote_count,
    'target_quarter', target_quarter,
    'created_at', created_at, 'updated_at', updated_at
  ) INTO result
  FROM public.roadmap_items WHERE id = new_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_roadmap_item(
  p_item_id UUID,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority_order INT DEFAULT NULL,
  p_target_quarter TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.roadmap_items SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    category = COALESCE(p_category, category),
    status = COALESCE(p_status, status),
    priority_order = COALESCE(p_priority_order, priority_order),
    target_quarter = COALESCE(p_target_quarter, target_quarter),
    released_at = CASE
      WHEN p_status = 'released' AND released_at IS NULL THEN NOW()
      ELSE released_at
    END,
    updated_at = NOW()
  WHERE id = p_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_roadmap_item(p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.roadmap_items WHERE id = p_item_id;
END;
$$;

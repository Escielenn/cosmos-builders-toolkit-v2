-- Fix RLS initplan warnings: wrap auth.uid() in (select ...) so Postgres
-- evaluates it once per query instead of once per row.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- TABLE: profiles
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ═══════════════════════════════════════════════════════════
-- TABLE: worlds
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own worlds" ON public.worlds;
CREATE POLICY "Users can view own worlds"
  ON public.worlds FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create worlds" ON public.worlds;
CREATE POLICY "Users can create worlds"
  ON public.worlds FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own worlds" ON public.worlds;
CREATE POLICY "Users can update own worlds"
  ON public.worlds FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own worlds" ON public.worlds;
CREATE POLICY "Users can delete own worlds"
  ON public.worlds FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Collaborators can view shared worlds" ON public.worlds;
CREATE POLICY "Collaborators can view shared worlds"
  ON public.worlds FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = (select auth.uid()))
  );

-- ═══════════════════════════════════════════════════════════
-- TABLE: worksheets
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own worksheets" ON public.worksheets;
CREATE POLICY "Users can view own worksheets"
  ON public.worksheets FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create worksheets" ON public.worksheets;
CREATE POLICY "Users can create worksheets"
  ON public.worksheets FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own worksheets" ON public.worksheets;
CREATE POLICY "Users can update own worksheets"
  ON public.worksheets FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own worksheets" ON public.worksheets;
CREATE POLICY "Users can delete own worksheets"
  ON public.worksheets FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Collaborators can view shared worksheets" ON public.worksheets;
CREATE POLICY "Collaborators can view shared worksheets"
  ON public.worksheets FOR SELECT
  TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Editors can update shared worksheets" ON public.worksheets;
CREATE POLICY "Editors can update shared worksheets"
  ON public.worksheets FOR UPDATE
  TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = (select auth.uid()) AND role = 'editor'
    )
  );

DROP POLICY IF EXISTS "Editors can create worksheets in shared worlds" ON public.worksheets;
CREATE POLICY "Editors can create worksheets in shared worlds"
  ON public.worksheets FOR INSERT
  TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = (select auth.uid()) AND role = 'editor'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- TABLE: world_notes
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own world notes" ON public.world_notes;
CREATE POLICY "Users can view own world notes"
  ON public.world_notes FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create world notes" ON public.world_notes;
CREATE POLICY "Users can create world notes"
  ON public.world_notes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own world notes" ON public.world_notes;
CREATE POLICY "Users can update own world notes"
  ON public.world_notes FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own world notes" ON public.world_notes;
CREATE POLICY "Users can delete own world notes"
  ON public.world_notes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Collaborators can view shared world notes" ON public.world_notes;
CREATE POLICY "Collaborators can view shared world notes"
  ON public.world_notes FOR SELECT
  TO authenticated
  USING (
    world_id IN (SELECT world_id FROM public.world_collaborators WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Editors can update shared world notes" ON public.world_notes;
CREATE POLICY "Editors can update shared world notes"
  ON public.world_notes FOR UPDATE
  TO authenticated
  USING (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = (select auth.uid()) AND role = 'editor'
    )
  );

DROP POLICY IF EXISTS "Editors can create shared world notes" ON public.world_notes;
CREATE POLICY "Editors can create shared world notes"
  ON public.world_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    world_id IN (
      SELECT world_id FROM public.world_collaborators
      WHERE user_id = (select auth.uid()) AND role = 'editor'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- TABLE: world_tags
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own world tags" ON public.world_tags;
CREATE POLICY "Users can view own world tags"
  ON public.world_tags FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own world tags" ON public.world_tags;
CREATE POLICY "Users can insert own world tags"
  ON public.world_tags FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own world tags" ON public.world_tags;
CREATE POLICY "Users can update own world tags"
  ON public.world_tags FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own world tags" ON public.world_tags;
CREATE POLICY "Users can delete own world tags"
  ON public.world_tags FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- TABLE: worksheet_tags (if exists)
-- ═══════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worksheet_tags') THEN
    DROP POLICY IF EXISTS "Users can view own tags" ON public.worksheet_tags;
    CREATE POLICY "Users can view own tags"
      ON public.worksheet_tags FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can insert own tags" ON public.worksheet_tags;
    CREATE POLICY "Users can insert own tags"
      ON public.worksheet_tags FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can update own tags" ON public.worksheet_tags;
    CREATE POLICY "Users can update own tags"
      ON public.worksheet_tags FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can delete own tags" ON public.worksheet_tags;
    CREATE POLICY "Users can delete own tags"
      ON public.worksheet_tags FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- TABLE: subscriptions
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Also fix if the linter-reported name variant exists
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;

-- ═══════════════════════════════════════════════════════════
-- TABLE: notion_connections
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own notion connection" ON public.notion_connections;
CREATE POLICY "Users can view own notion connection"
  ON public.notion_connections FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own notion connection" ON public.notion_connections;
CREATE POLICY "Users can insert own notion connection"
  ON public.notion_connections FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notion connection" ON public.notion_connections;
CREATE POLICY "Users can update own notion connection"
  ON public.notion_connections FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own notion connection" ON public.notion_connections;
CREATE POLICY "Users can delete own notion connection"
  ON public.notion_connections FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- TABLE: worksheet_link_shares
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Owners can view own worksheet shares" ON public.worksheet_link_shares;
CREATE POLICY "Owners can view own worksheet shares"
  ON public.worksheet_link_shares FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Owners can create worksheet shares" ON public.worksheet_link_shares;
CREATE POLICY "Owners can create worksheet shares"
  ON public.worksheet_link_shares FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Owners can update own worksheet shares" ON public.worksheet_link_shares;
CREATE POLICY "Owners can update own worksheet shares"
  ON public.worksheet_link_shares FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Owners can delete own worksheet shares" ON public.worksheet_link_shares;
CREATE POLICY "Owners can delete own worksheet shares"
  ON public.worksheet_link_shares FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

-- ═══════════════════════════════════════════════════════════
-- TABLE: world_link_shares
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Owners can view own world shares" ON public.world_link_shares;
CREATE POLICY "Owners can view own world shares"
  ON public.world_link_shares FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Owners can create world shares" ON public.world_link_shares;
CREATE POLICY "Owners can create world shares"
  ON public.world_link_shares FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Owners can update own world shares" ON public.world_link_shares;
CREATE POLICY "Owners can update own world shares"
  ON public.world_link_shares FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Owners can delete own world shares" ON public.world_link_shares;
CREATE POLICY "Owners can delete own world shares"
  ON public.world_link_shares FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

-- ═══════════════════════════════════════════════════════════
-- TABLE: world_collaborators
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Collaborators can view own membership" ON public.world_collaborators;
CREATE POLICY "Collaborators can view own membership"
  ON public.world_collaborators FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "World owner can add collaborators" ON public.world_collaborators;
CREATE POLICY "World owner can add collaborators"
  ON public.world_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

DROP POLICY IF EXISTS "World owner can update collaborator roles" ON public.world_collaborators;
CREATE POLICY "World owner can update collaborator roles"
  ON public.world_collaborators FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

DROP POLICY IF EXISTS "World owner can remove collaborators" ON public.world_collaborators;
CREATE POLICY "World owner can remove collaborators"
  ON public.world_collaborators FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

DROP POLICY IF EXISTS "Collaborators can leave world" ON public.world_collaborators;
CREATE POLICY "Collaborators can leave world"
  ON public.world_collaborators FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- TABLE: world_invites
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "World owner can view invites" ON public.world_invites;
CREATE POLICY "World owner can view invites"
  ON public.world_invites FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

DROP POLICY IF EXISTS "World owner can create invites" ON public.world_invites;
CREATE POLICY "World owner can create invites"
  ON public.world_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

DROP POLICY IF EXISTS "World owner can update invites" ON public.world_invites;
CREATE POLICY "World owner can update invites"
  ON public.world_invites FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

DROP POLICY IF EXISTS "World owner can delete invites" ON public.world_invites;
CREATE POLICY "World owner can delete invites"
  ON public.world_invites FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) IN (SELECT user_id FROM public.worlds WHERE id = world_id)
  );

DROP POLICY IF EXISTS "Invited users can view own invites" ON public.world_invites;
CREATE POLICY "Invited users can view own invites"
  ON public.world_invites FOR SELECT
  TO authenticated
  USING (
    lower(invited_email) = lower((SELECT email FROM auth.users WHERE id = (select auth.uid())))
  );

-- ═══════════════════════════════════════════════════════════
-- TABLE: contact_submissions (if exists, created via dashboard)
-- ═══════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_submissions') THEN
    DROP POLICY IF EXISTS "Users can view own contact submissions" ON public.contact_submissions;
    CREATE POLICY "Users can view own contact submissions"
      ON public.contact_submissions FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- TABLE: support_tickets (if exists, created via dashboard)
-- ═══════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets') THEN
    DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
    CREATE POLICY "Users can view own support tickets"
      ON public.support_tickets FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- STORAGE: avatars, world-headers, moodboard-images
-- ═══════════════════════════════════════════════════════════

-- Avatars
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
CREATE POLICY "Users can view own avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- World headers
DROP POLICY IF EXISTS "Users can view own world headers" ON storage.objects;
CREATE POLICY "Users can view own world headers"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'world-headers' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can upload world headers" ON storage.objects;
CREATE POLICY "Authenticated users can upload world headers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'world-headers' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own world headers" ON storage.objects;
CREATE POLICY "Users can update their own world headers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'world-headers' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own world headers" ON storage.objects;
CREATE POLICY "Users can delete their own world headers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'world-headers' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- Moodboard images
DROP POLICY IF EXISTS "Users can view own moodboard images" ON storage.objects;
CREATE POLICY "Users can view own moodboard images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'moodboard-images' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can upload moodboard images" ON storage.objects;
CREATE POLICY "Authenticated users can upload moodboard images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'moodboard-images' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own moodboard images" ON storage.objects;
CREATE POLICY "Users can update their own moodboard images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'moodboard-images' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own moodboard images" ON storage.objects;
CREATE POLICY "Users can delete their own moodboard images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'moodboard-images' AND (select auth.uid())::text = (storage.foldername(name))[1]);

COMMIT;

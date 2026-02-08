-- ============================================================
-- FIX: Remove circular RLS reference between worlds and world_collaborators
--
-- The "World owner can view collaborators" SELECT policy on
-- world_collaborators references the worlds table, which has a
-- SELECT policy that references world_collaborators, creating
-- a circular dependency that can cause silent query failures.
--
-- This policy is not needed by any current code path:
-- - useWorldCollaborators uses the RPC function (SECURITY DEFINER)
-- - useSharedWorlds and useMyWorldRole use "Collaborators can view own membership"
-- ============================================================

DROP POLICY IF EXISTS "World owner can view collaborators" ON public.world_collaborators;

-- Also remove the debug function from the previous diagnostic migration
DROP FUNCTION IF EXISTS public.debug_get_policies();

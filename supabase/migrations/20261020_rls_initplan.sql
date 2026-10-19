-- Tier 5 DB tune-up: wrap auth.uid() in (select ...) so RLS evaluates it once per query (auth_rls_initplan).
-- Same predicates as before; ALTER POLICY only.

ALTER POLICY "Collaborators can view chronicle_branches" ON public.chronicle_branches USING (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid())));
ALTER POLICY "Editors can create chronicle_branches" ON public.chronicle_branches WITH CHECK (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid()) AND wc.role = 'editor'));
ALTER POLICY "Editors can delete chronicle_branches" ON public.chronicle_branches USING (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid()) AND wc.role = 'editor'));
ALTER POLICY "Editors can update chronicle_branches" ON public.chronicle_branches USING (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid()) AND wc.role = 'editor')) WITH CHECK (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid()) AND wc.role = 'editor'));
ALTER POLICY "World owner can create chronicle_branches" ON public.chronicle_branches WITH CHECK (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid())));
ALTER POLICY "World owner can delete chronicle_branches" ON public.chronicle_branches USING (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid())));
ALTER POLICY "World owner can update chronicle_branches" ON public.chronicle_branches USING (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid()))) WITH CHECK (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid())));
ALTER POLICY "World owner can view chronicle_branches" ON public.chronicle_branches USING (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid())));

ALTER POLICY "Collaborators can view chronicle_jumps" ON public.chronicle_jumps USING (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid())));
ALTER POLICY "Editors can create chronicle_jumps" ON public.chronicle_jumps WITH CHECK (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid()) AND wc.role = 'editor'));
ALTER POLICY "Editors can delete chronicle_jumps" ON public.chronicle_jumps USING (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid()) AND wc.role = 'editor'));
ALTER POLICY "Editors can update chronicle_jumps" ON public.chronicle_jumps USING (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid()) AND wc.role = 'editor')) WITH CHECK (world_id IN (SELECT wc.world_id FROM public.world_collaborators wc WHERE wc.user_id = (select auth.uid()) AND wc.role = 'editor'));
ALTER POLICY "World owner can create chronicle_jumps" ON public.chronicle_jumps WITH CHECK (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid())));
ALTER POLICY "World owner can delete chronicle_jumps" ON public.chronicle_jumps USING (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid())));
ALTER POLICY "World owner can update chronicle_jumps" ON public.chronicle_jumps USING (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid()))) WITH CHECK (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid())));
ALTER POLICY "World owner can view chronicle_jumps" ON public.chronicle_jumps USING (world_id IN (SELECT worlds.id FROM public.worlds WHERE worlds.user_id = (select auth.uid())));

CREATE INDEX IF NOT EXISTS idx_facts_asserted_by ON public.facts (asserted_by);

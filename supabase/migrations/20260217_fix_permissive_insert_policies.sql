-- Fix rls_policy_always_true warnings: replace WITH CHECK (true) with
-- meaningful field validation on public insert policies.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy

-- contact_submissions: require name, email, and message
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON public.contact_submissions;
CREATE POLICY "Anyone can create contact submissions"
  ON public.contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND name <> '' AND
    email IS NOT NULL AND email <> '' AND
    message IS NOT NULL AND message <> ''
  );

-- support_tickets: require name, email, subject, and message
DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create support tickets"
  ON public.support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND name <> '' AND
    email IS NOT NULL AND email <> '' AND
    subject IS NOT NULL AND subject <> '' AND
    message IS NOT NULL AND message <> ''
  );

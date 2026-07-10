-- ============================================================
-- Security hardening sweep (2026-07-10 review) — APPLIED 2026-07-10
-- ============================================================

-- 1. entity_connections_bidirectional was SECURITY DEFINER (advisor
--    ERROR): bypassed caller RLS, exposing all users' graph edges to
--    any authenticated user. security_invoker honors the caller's RLS
--    (owner + collaborator + community policies on the base table).
alter view public.entity_connections_bidirectional set (security_invoker = true);

-- 2. Pin search_path of the flagged trigger function (advisor WARN).
alter function public.trim_document_versions() set search_path = public;

-- 3. audio-tracks: broad SELECT policy allowed ANYONE to enumerate all
--    users' audio file paths. Playback uses public-bucket URLs (no
--    policy involved); scope listing to the owner's own folder.
drop policy if exists "Anyone can listen to audio tracks" on storage.objects;
create policy "Users can list their own audio tracks"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'audio-tracks'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- 4. Waitlist abuse control: per-IP throttle state (used by the
--    waitlist-confirmation edge function).
alter table public.waitlist add column if not exists ip_hash text;
create index if not exists waitlist_ip_recent_idx on public.waitlist (ip_hash, created_at);

-- 5. Document intentionally policy-less tables (advisor INFO).
comment on table public.waitlist is
  'Early-access launch waitlist. Writes only via waitlist-confirmation edge function (service role). RLS enabled with NO client policies BY DESIGN.';
comment on table public.admin_todos is
  'Admin-only. RLS enabled with no client policies BY DESIGN - dashboard/service access only.';

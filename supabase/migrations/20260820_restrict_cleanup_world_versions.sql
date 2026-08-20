-- cleanup_world_versions() is a global, unparameterized retention-tiering
-- maintenance job (prunes ALL worlds' version history on a schedule) with no
-- caller check, EXECUTE-granted to anon/authenticated. No frontend caller —
-- it's meant to run as a scheduled job under service_role, not be publicly
-- invocable. Any user could currently force it to run ahead of schedule.
-- Applied live via Supabase MCP 2026-08-20; this file tracks it in history.

REVOKE EXECUTE ON FUNCTION public.cleanup_world_versions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_world_versions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_world_versions() FROM PUBLIC;

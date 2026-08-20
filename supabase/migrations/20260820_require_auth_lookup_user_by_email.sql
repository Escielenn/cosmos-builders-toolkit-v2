-- lookup_user_by_email had no caller-identity check and was EXECUTE-granted to
-- anon, letting any unauthenticated request enumerate emails and read back
-- display_name + avatar_url for matches. The only legitimate caller
-- (use-collaborators.ts, inviting a collaborator) is already gated to signed-in
-- users client-side; this makes that a real, server-enforced boundary.
-- Applied live via Supabase MCP 2026-08-20; this file tracks it in history.

CREATE OR REPLACE FUNCTION public.lookup_user_by_email(p_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;

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
$function$;

REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(text) FROM PUBLIC;

-- get_subscription_tier(check_user_id) took an arbitrary user id with no
-- caller check and was EXECUTE-granted to anon: any unauthenticated caller
-- could learn any other user's subscription tier. Confirmed unused by the
-- frontend and uncalled by any other function, so this closes a live but
-- dead-code exposure rather than fixing a real caller.
-- Applied live via Supabase MCP 2026-08-20; this file tracks it in history.

CREATE OR REPLACE FUNCTION public.get_subscription_tier(check_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result_tier TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != check_user_id THEN
    RETURN NULL;
  END IF;

  SELECT tier INTO result_tier
  FROM public.subscriptions
  WHERE user_id = check_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > NOW())
  ORDER BY
    CASE tier WHEN 'vanguard' THEN 1 WHEN 'pro' THEN 2 END
  LIMIT 1;

  RETURN result_tier;  -- NULL if no active subscription
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_subscription_tier(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_subscription_tier(uuid) FROM PUBLIC;

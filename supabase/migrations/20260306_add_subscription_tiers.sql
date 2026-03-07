-- ============================================================
-- Subscription Tiers: Add tier column (pro, vanguard)
-- ============================================================

-- Add tier column — defaults to 'pro' so all existing subscriptions
-- are automatically categorized correctly with no data migration needed
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'pro';

-- Restrict to known tiers
ALTER TABLE public.subscriptions
ADD CONSTRAINT valid_subscription_tier CHECK (tier IN ('pro', 'vanguard'));

-- Index for tier-based lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON public.subscriptions(tier);

-- ============================================================
-- get_subscription_tier(user_id) → TEXT
-- Returns the highest active tier for a user, or NULL if none
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_subscription_tier(check_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_tier TEXT;
BEGIN
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
$$;

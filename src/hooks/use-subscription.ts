import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SubscriptionTier } from "@/lib/tools-config";
import { getCourseDiscount } from "@/lib/tools-config";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  price_id: string;
  plan_type: 'monthly' | 'yearly';
  tier: 'pro' | 'vanguard';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        throw error;
      }
      return data as Subscription | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createCheckoutSession = useMutation({
    mutationFn: async ({ priceType, tier = 'pro' }: { priceType: 'monthly' | 'yearly'; tier?: 'pro' | 'vanguard' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      const response = await supabase.functions.invoke('create-checkout-session', {
        body: { priceType, tier },
      });

      if (response.error) {
        // Extract the actual error message from the edge function JSON response body.
        // The FunctionsHttpError stores the raw Response in .context, body not yet consumed.
        let extractedMessage: string | undefined;
        try {
          const ctx = (response.error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            extractedMessage = body?.error;
          }
        } catch {
          // Body couldn't be parsed, fall through to generic message
        }
        throw new Error(extractedMessage || response.error.message);
      }
      if (response.data?.error) throw new Error(response.data.error);
      return response.data as { sessionId: string; url: string };
    },
  });

  const createPortalSession = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('create-portal-session', {
        body: {},
      });

      if (response.error) throw response.error;
      return response.data as { url: string };
    },
  });

  // Fetch the most recent subscription of any status (for lapsed detection)
  const lapsedQuery = useQuery({
    queryKey: ['subscription-lapsed', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching lapsed subscription:', error);
        return null;
      }
      return data as Subscription | null;
    },
    enabled: !!user && !subscriptionQuery.data,
    staleTime: 1000 * 60 * 5,
  });

  const isSubscribed = !!subscriptionQuery.data &&
    ['active', 'trialing'].includes(subscriptionQuery.data.status);

  // Tier-related computed properties
  const tier: SubscriptionTier = isSubscribed
    ? (subscriptionQuery.data?.tier as 'pro' | 'vanguard') || 'pro'
    : 'free';
  const isVanguard = tier === 'vanguard';
  const courseDiscount = isSubscribed && subscriptionQuery.data
    ? getCourseDiscount(tier, subscriptionQuery.data.plan_type)
    : '0%';

  // Compute expiry info
  const sub = subscriptionQuery.data;
  const daysUntilExpiry = sub?.current_period_end
    ? Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = isSubscribed && !!sub?.cancel_at_period_end && daysUntilExpiry !== null && daysUntilExpiry <= 14;
  const hasLapsedSubscription = !isSubscribed && !!lapsedQuery.data &&
    !['active', 'trialing'].includes(lapsedQuery.data.status);

  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['subscription-lapsed', user?.id] });
  };

  // Poll for subscription after checkout (webhook may take a few seconds)
  const waitForSubscription = async (maxAttempts = 10, intervalMs = 1500): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      // Force refetch
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      await queryClient.refetchQueries({ queryKey: ['subscription', user?.id] });

      // Check if subscription is now active
      const data = queryClient.getQueryData<Subscription | null>(['subscription', user?.id]);
      if (data && ['active', 'trialing'].includes(data.status)) {
        return true;
      }

      // Wait before next attempt
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    return false;
  };

  return {
    subscription: subscriptionQuery.data,
    isSubscribed,
    tier,
    isVanguard,
    courseDiscount,
    isLoading: subscriptionQuery.isLoading,
    error: subscriptionQuery.error,
    isExpiringSoon,
    daysUntilExpiry,
    hasLapsedSubscription,
    createCheckoutSession,
    createPortalSession,
    refreshSubscription,
    waitForSubscription,
  };
};

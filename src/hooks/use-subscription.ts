import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  price_id: string;
  plan_type: 'monthly' | 'yearly';
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
    mutationFn: async (priceType: 'monthly' | 'yearly') => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceType,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      return response.data as { sessionId: string; url: string };
    },
  });

  const createPortalSession = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/profile`,
        },
      });

      if (response.error) throw response.error;
      return response.data as { url: string };
    },
  });

  const isSubscribed = !!subscriptionQuery.data &&
    ['active', 'trialing'].includes(subscriptionQuery.data.status);

  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
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
    isLoading: subscriptionQuery.isLoading,
    error: subscriptionQuery.error,
    createCheckoutSession,
    createPortalSession,
    refreshSubscription,
    waitForSubscription,
  };
};

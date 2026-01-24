import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { useBackground } from "@/hooks/use-background";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  useBackground();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, subscription, createCheckoutSession, createPortalSession, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | 'portal' | null>(null);

  // Handle success/cancel query params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Welcome to Pro!",
        description: "Your subscription is now active. Enjoy all the tools!",
      });
      refreshSubscription();
      // Clean up URL
      window.history.replaceState({}, '', '/pricing');
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Checkout canceled",
        description: "No worries, you can upgrade anytime.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/pricing');
    }
  }, [searchParams, toast, refreshSubscription]);

  const handleCheckout = async (priceType: 'monthly' | 'yearly') => {
    if (!user) {
      navigate("/auth?redirect=/pricing");
      return;
    }

    setLoading(priceType);
    try {
      const result = await createCheckoutSession.mutateAsync(priceType);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('portal');
    try {
      const result = await createPortalSession.mutateAsync();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const freeFeatures = [
    "3 worldbuilding tools",
    "Unlimited local drafts",
    "Cloud sync (with account)",
    "Export to JSON",
  ];

  const proFeatures = [
    "All 8+ worldbuilding tools",
    "Unlimited worlds & worksheets",
    "Cloud sync across devices",
    "Export to PDF & JSON",
    "Priority support",
    "All future tools & features",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            Simple Pricing
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Build Better Worlds
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with essential tools, upgrade to Pro for the complete worldbuilding toolkit.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <GlassPanel className="p-8">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold mb-2">Free</h2>
              <p className="text-4xl font-bold">$0<span className="text-lg font-normal text-muted-foreground">/forever</span></p>
            </div>

            <ul className="space-y-3 mb-8">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="text-sm text-muted-foreground mb-4">Free tools:</p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-6">
              <li>Environmental Chain Reaction</li>
              <li>Spacecraft Designer</li>
              <li>Propulsion Consequences Map</li>
            </ul>

            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Get Started Free
            </Button>
          </GlassPanel>

          {/* Pro Plan */}
          <GlassPanel glow className="p-8 border-2 border-primary relative">
            <div className="absolute -top-3 right-4">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>

            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" />
                Pro
              </h2>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold">$12.50</p>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">or $99/year (save 34%)</p>
            </div>

            <ul className="space-y-3 mb-8">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isSubscribed ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    You're subscribed! ({subscription?.plan_type})
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={loading === 'portal'}
                >
                  {loading === 'portal' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Manage Subscription
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleCheckout('yearly')}
                  disabled={loading !== null}
                >
                  {loading === 'yearly' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Crown className="w-4 h-4 mr-2" />
                  )}
                  Get Pro Yearly - $99/year
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCheckout('monthly')}
                  disabled={loading !== null}
                >
                  {loading === 'monthly' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Monthly - $12.50/month
                </Button>
              </div>
            )}
          </GlassPanel>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto">
          <GlassPanel className="p-8">
            <h3 className="font-display text-xl font-semibold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Can I cancel anytime?</p>
                <p className="text-muted-foreground">Yes! Cancel anytime from your billing portal. You'll keep access until the end of your billing period.</p>
              </div>
              <div>
                <p className="font-medium">What payment methods do you accept?</p>
                <p className="text-muted-foreground">We accept all major credit cards, debit cards, and many local payment methods through Stripe.</p>
              </div>
              <div>
                <p className="font-medium">Will I lose my data if I cancel?</p>
                <p className="text-muted-foreground">No. Your worlds and worksheets remain saved. You just won't be able to access Pro tools.</p>
              </div>
              <div>
                <p className="font-medium">Can I switch between monthly and yearly?</p>
                <p className="text-muted-foreground">Yes! You can change your plan anytime through the billing portal.</p>
              </div>
            </div>
          </GlassPanel>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StellarForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;

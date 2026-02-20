import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { FREE_TOOL_IDS, PRO_TOOL_IDS, PRICING } from "@/lib/tools-config";
import { PageBursts } from "@/components/ui/data-burst";
import { PRICING_BURSTS } from "@/lib/data-bursts";

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, subscription, createCheckoutSession, createPortalSession, refreshSubscription, waitForSubscription } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | 'portal' | null>(null);
  const [activating, setActivating] = useState(false);

  // Handle success/cancel query params
  useEffect(() => {
    const handleSuccess = async () => {
      setActivating(true);
      toast({
        title: "ACTIVATING ACCESS...",
        description: "Confirming payment. Stand by.",
      });

      // Poll for subscription (webhook may take a few seconds)
      const success = await waitForSubscription();

      if (success) {
        toast({
          title: "PRO ACCESS ACTIVATED.",
          description: "All instruments unlocked.",
        });
      } else {
        toast({
          title: "Subscription pending",
          description: "Your payment was received. It may take a moment to activate.",
        });
        refreshSubscription();
      }

      setActivating(false);
      // Clean up URL
      window.history.replaceState({}, '', '/pricing');
    };

    if (searchParams.get('success') === 'true') {
      handleSuccess();
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Checkout canceled",
        description: "Upgrade available at any time.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/pricing');
    }
  }, [searchParams, toast, refreshSubscription, waitForSubscription]);

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
        description: error instanceof Error ? error.message : "Failed to start checkout. Retry when ready.",
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
        description: "Failed to open billing portal. Retry when ready.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const totalTools = FREE_TOOL_IDS.length + PRO_TOOL_IDS.length;

  const freeFeatures = [
    `${FREE_TOOL_IDS.length} worldbuilding tools`,
    "Unlimited local drafts",
    "Cloud sync (with account)",
    "Export to JSON",
  ];

  const proFeatures = [
    `All ${totalTools} worldbuilding tools`,
    "Unlimited worlds & worksheets",
    "Cloud sync across devices",
    "Export to PDF, JSON & Notion",
    "Priority support",
    "All future tools & features",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16">
        <PageBursts bursts={PRICING_BURSTS} />
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            ACCESS TIERS
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-light mb-4 tracking-sf-wide">
            UPGRADE YOUR ACCESS
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Free accounts access 3 instruments. Pro unlocks all 30.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <GlassPanel className="p-8">
            <div className="mb-6">
              <h2 className="font-heading text-2xl font-bold mb-2">STANDARD ACCESS</h2>
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
              BEGIN
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
              <h2 className="font-heading text-2xl font-bold mb-2 flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" />
                PRO ACCESS
              </h2>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold">${PRICING.monthly.price}</p>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">or ${PRICING.yearly.price}/year (save {PRICING.yearly.savings})</p>
            </div>

            <ul className="space-y-3 mb-8">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {activating ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <Loader size="sm" className="mb-2" />
                  <p className="text-sm font-medium">PRO ACCESS ACTIVATION IN PROGRESS.</p>
                </div>
              </div>
            ) : isSubscribed ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Subscription active. ({subscription?.plan_type})
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={loading === 'portal'}
                >
                  {loading === 'portal' ? (
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : null}
                  MANAGE ACCESS
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
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : (
                    <Crown className="w-4 h-4 mr-2" />
                  )}
                  UPGRADE (YEARLY) — ${PRICING.yearly.price}/year
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCheckout('monthly')}
                  disabled={loading !== null}
                >
                  {loading === 'monthly' ? (
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : null}
                  Monthly - ${PRICING.monthly.price}/month
                </Button>
              </div>
            )}
          </GlassPanel>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto">
          <GlassPanel className="p-8">
            <h3 className="font-heading text-xl font-semibold mb-4">Frequently Asked Questions</h3>
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

      <Footer />
    </div>
  );
};

export default Pricing;

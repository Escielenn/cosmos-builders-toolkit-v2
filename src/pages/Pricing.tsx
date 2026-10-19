import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Check, Zap, Sparkles, Map } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, type Subscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import WelcomeDialog from "@/components/onboarding/WelcomeDialog";
import { FREE_TOOL_IDS, PRICING, TOTAL_TOOL_COUNT, getToolDisplayName } from "@/lib/tools-config";
import { FREE_PLAN_GROUPS, PRO_PLAN_ITEMS } from "@/lib/plan-features";
import { PageBursts } from "@/components/ui/data-burst";
import { PRICING_BURSTS } from "@/lib/data-bursts";
import { ParallaxStrips } from "@/components/ambient/ParallaxStrips";
import { mapError } from "@/lib/ship-voice";
import { useMetaTags } from "@/hooks/use-meta-tags";

const Pricing = () => {
  useMetaTags({ title: "Pricing" });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, subscription, tier, isVanguard, createCheckoutSession, createPortalSession, refreshSubscription, waitForSubscription } = useSubscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | 'vanguard-monthly' | 'vanguard-yearly' | 'portal' | null>(null);
  const [activating, setActivating] = useState(false);
  const [showProWelcome, setShowProWelcome] = useState(false);
  const [showVanguardWelcome, setShowVanguardWelcome] = useState(false);
  const handledRef = useRef(false);

  // Handle success/cancel query params, run once only
  useEffect(() => {
    if (handledRef.current) return;

    if (searchParams.get('success') === 'true') {
      handledRef.current = true;

      (async () => {
        setActivating(true);
        toast({
          title: "ACTIVATING ACCESS...",
          description: "CONFIRMING PAYMENT. STAND BY.",
        });

        const success = await waitForSubscription();

        if (success) {
          toast({
            title: "ACCESS ACTIVATED.",
            description: "ALL INSTRUMENTS UNLOCKED.",
          });

          // Show tier-specific welcome dialog
          const freshSub = queryClient.getQueryData<Subscription | null>(['subscription', user?.id]);
          const activatedTier = freshSub?.tier || 'pro';

          if (activatedTier === 'vanguard') {
            try {
              if (!localStorage.getItem('sf-welcome-vanguard-shown')) {
                localStorage.setItem('sf-welcome-vanguard-shown', 'true');
                setShowVanguardWelcome(true);
              }
            } catch { /* localStorage unavailable */ }
          } else {
            try {
              if (!localStorage.getItem('sf-welcome-pro-shown')) {
                localStorage.setItem('sf-welcome-pro-shown', 'true');
                setShowProWelcome(true);
              }
            } catch { /* localStorage unavailable */ }
          }
        } else {
          toast({
            title: "SUBSCRIPTION PENDING.",
            description: "PAYMENT RECEIVED. ACTIVATION IN PROGRESS.",
          });
          refreshSubscription();
        }

        setActivating(false);
        window.history.replaceState({}, '', '/pricing');
      })();
    } else if (searchParams.get('canceled') === 'true') {
      handledRef.current = true;
      toast({
        title: "CHECKOUT CANCELED.",
        description: "CLEARANCE AVAILABLE WHEN READY.",
      });
      window.history.replaceState({}, '', '/pricing');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCheckout = async (priceType: 'monthly' | 'yearly', selectedTier: 'pro' | 'vanguard' = 'pro') => {
    if (!user) {
      navigate("/auth?redirect=/pricing");
      return;
    }

    const loadingKey = selectedTier === 'vanguard' ? `vanguard-${priceType}` as const : priceType;
    setLoading(loadingKey);
    try {
      const result = await createCheckoutSession.mutateAsync({ priceType, tier: selectedTier });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast({
        title: "OPERATION FAILED.",
        description: mapError(error),
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
        title: "OPERATION FAILED.",
        description: "BILLING PORTAL UNAVAILABLE. RETRY WHEN READY.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Plan contents come from src/lib/plan-features.ts, the one place a plan
  // promise may be made. Free is the whole writing side of the ship; Pro
  // adds instruments and world-level exports.
  const proFeatures = [
    ...PRO_PLAN_ITEMS,
    `${PRICING.pro.monthly.courseDiscount}–${PRICING.pro.yearly.courseDiscount} off SF courses`,
  ];

  const vanguardFeatures = [
    "Everything in Pro",
    "10 roadmap votes per month",
    "Early access to new tools",
    "Bi-weekly Office Hours",
    "Private Discord channel",
    "Custom export themes",
    "10–25% off SF courses",
  ];

  // Determine if user is on Pro (not Vanguard), show upgrade CTA
  const isProOnly = isSubscribed && tier === 'pro';

  return (
    <div className="min-h-screen bg-sf-void">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16">
        <PageBursts bursts={PRICING_BURSTS} />
        {/* Hero, with parallax telemetry strips */}
        <section className="relative overflow-hidden mb-16 py-12">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <ParallaxStrips height={300} />
          </div>
          <div className="relative z-10">
            {/* Marketing hero (15-PAGE-CHROME: Pricing keeps its own hero and
                does not use PageHeader). Inlined when SectionHero was retired. */}
            <div className="inline-flex items-center gap-3.5 font-mono text-sf-mono uppercase text-sf-primary-text mb-7">
              <span aria-hidden className="block w-12 h-px bg-sf-primary-text" />
              <span>// access tiers</span>
            </div>
            <h1 className="m-0 font-serif italic font-light text-t1 text-sf-h1 leading-[1.05]">
              Write the book free. <span className="text-sf-primary-text">Unlock every instrument.</span>
            </h1>
            <p className="font-sans text-sf-body text-t2 mt-7 max-w-[780px] leading-[1.55]">
              {`The Studio, Codex, Chronicle, Canon and Compile come with every account. Pro opens all ${TOTAL_TOOL_COUNT} instruments and full-world exports. Vanguard shapes what comes next.`}
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {/* Free Plan */}
          <GlassPanel className="p-8">
            <div className="mb-6">
              <h2 className="font-heading text-xl font-light uppercase tracking-[2px] text-t1 mb-2">STANDARD ACCESS</h2>
              <p className="text-4xl font-light text-t1">$0<span className="text-lg text-t3">/forever</span></p>
            </div>

            <div className="space-y-5 mb-8">
              {FREE_PLAN_GROUPS.map((group) => (
                <div key={group.heading}>
                  <p className="font-heading text-sf-eyebrow uppercase text-t4 mb-2">{group.heading}</p>
                  <ul className="space-y-2">
                    {group.items.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 text-sf-emerald-text shrink-0" />
                        <span className="text-t2">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="font-heading text-sf-eyebrow uppercase text-t4 mb-3">Free instruments</p>
            <ul className="text-sm text-t2 space-y-1 mb-6">
              {FREE_TOOL_IDS.map((id) => (
                <li key={id}>{getToolDisplayName(id)}</li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth#create-account")}
            >
              Start Free
            </Button>
          </GlassPanel>

          {/* Pro Plan */}
          <GlassPanel glow className="p-8 border-2 border-sf-primary relative">
            <div className="absolute -top-3 right-4">
              <span className="inline-flex items-center px-2 py-1 font-heading text-sf-eyebrow uppercase bg-sf-primary text-sf-on-primary">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h2 className="font-heading text-xl font-light uppercase tracking-[2px] text-t1 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-sf-amber-text" />
                PRO ACCESS
              </h2>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-light text-t1">${PRICING.pro.monthly.price}</p>
                <span className="text-lg text-t3">/month</span>
              </div>
              <p className="text-sm text-t2">or ${PRICING.pro.yearly.price}/year (save {PRICING.pro.yearly.savings})</p>
            </div>

            <p className="text-sm text-t1 mb-3">Everything in Standard, plus:</p>
            <ul className="space-y-3 mb-8">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 text-sf-emerald-text shrink-0" />
                  <span className="text-t2">{feature}</span>
                </li>
              ))}
            </ul>

            {activating ? (
              <div className="space-y-3">
                <div className="p-4 rounded-none bg-sf-primary/[0.06] text-center">
                  <Loader size="sm" className="mb-2" />
                  <p className="text-sm font-medium text-t1">ACTIVATION IN PROGRESS.</p>
                </div>
              </div>
            ) : isSubscribed && tier === 'pro' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-none bg-sf-emerald/[0.06] text-center">
                  <p className="text-sm font-medium uppercase text-sf-emerald-text">
                    Pro active ({subscription?.plan_type})
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
            ) : isVanguard ? (
              <div className="p-3 rounded-none bg-sf-emerald/[0.06] text-center">
                <p className="text-sm uppercase text-t2">Included in Vanguard access.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleCheckout('yearly', 'pro')}
                  disabled={loading !== null}
                >
                  {loading === 'yearly' ? (
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Upgrade yearly, ${PRICING.pro.yearly.price}/yr
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCheckout('monthly', 'pro')}
                  disabled={loading !== null}
                >
                  {loading === 'monthly' ? (
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : null}
                  Upgrade monthly, ${PRICING.pro.monthly.price}/mo
                </Button>
              </div>
            )}
          </GlassPanel>

          {/* Vanguard Plan */}
          <GlassPanel className="p-8 border-2 border-sf-violet relative">
            <div className="absolute -top-3 right-4">
              <span className="inline-flex items-center px-2 py-1 font-heading text-sf-eyebrow uppercase bg-sf-violet text-sf-on-violet">
                Shape the Future
              </span>
            </div>

            <div className="mb-6">
              <h2 className="font-heading text-xl font-light uppercase tracking-[2px] text-t1 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sf-violet" />
                VANGUARD ACCESS
              </h2>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-light text-t1">${PRICING.vanguard.monthly.price}</p>
                <span className="text-lg text-t3">/month</span>
              </div>
              <p className="text-sm text-t2">or ${PRICING.vanguard.yearly.price}/year (save {PRICING.vanguard.yearly.savings})</p>
            </div>

            <ul className="space-y-3 mb-8">
              {vanguardFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-sf-violet shrink-0" />
                  <span className="text-t2">{feature}</span>
                </li>
              ))}
            </ul>

            {activating ? (
              <div className="space-y-3">
                <div className="p-4 rounded-none bg-sf-violet/[0.06] text-center">
                  <Loader size="sm" className="mb-2" />
                  <p className="text-sm font-medium text-t1">ACTIVATION IN PROGRESS.</p>
                </div>
              </div>
            ) : isVanguard ? (
              <div className="space-y-3">
                <div className="p-3 rounded-none bg-sf-violet/[0.06] text-center">
                  <p className="text-sm font-medium uppercase text-sf-violet-text">
                    Vanguard active ({subscription?.plan_type})
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
            ) : isProOnly ? (
              <div className="space-y-3">
                <Button
                  className="w-full bg-sf-violet text-sf-on-violet hover:bg-sf-violet"
                  size="lg"
                  onClick={() => handleCheckout('yearly', 'vanguard')}
                  disabled={loading !== null}
                >
                  {loading === 'vanguard-yearly' ? (
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Upgrade to Vanguard, ${PRICING.vanguard.yearly.price}/yr
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-sf-violet hover:border-sf-violet"
                  onClick={() => handleCheckout('monthly', 'vanguard')}
                  disabled={loading !== null}
                >
                  {loading === 'vanguard-monthly' ? (
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : null}
                  Upgrade monthly, ${PRICING.vanguard.monthly.price}/mo
                </Button>
                <p className="text-xs text-t4 text-center">
                  Your Pro plan will be upgraded. Stripe handles the prorated billing.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full bg-sf-violet text-sf-on-violet hover:bg-sf-violet"
                  size="lg"
                  onClick={() => handleCheckout('yearly', 'vanguard')}
                  disabled={loading !== null}
                >
                  {loading === 'vanguard-yearly' ? (
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Upgrade yearly, ${PRICING.vanguard.yearly.price}/yr
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-sf-violet hover:border-sf-violet"
                  onClick={() => handleCheckout('monthly', 'vanguard')}
                  disabled={loading !== null}
                >
                  {loading === 'vanguard-monthly' ? (
                    <Loader variant="inline" size="sm" className="mr-2" />
                  ) : null}
                  Upgrade monthly, ${PRICING.vanguard.monthly.price}/mo
                </Button>
              </div>
            )}
          </GlassPanel>
        </section>

        {/* Vanguard Details Banner */}
        <section className="max-w-4xl mx-auto mb-16">
          <GlassPanel className="p-8 border-sf-violet">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-none bg-sf-violet/[0.06] border border-sf-violet flex items-center justify-center shrink-0">
                <Map className="w-6 h-6 text-sf-violet" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-light uppercase tracking-[2px] text-t1 mb-1">Vanguard: Shape What Comes Next</h3>
                <p className="text-sm text-t2">
                  Vanguard members don't just use StellarForge, they help build it. Vote on the roadmap, get early access to new tools before anyone else, and join bi-weekly Office Hours to discuss science fiction worldbuilding directly with the creator.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-t2">
              <div>
                <p className="text-t1 font-medium mb-1">Office Hours (Starting Late April)</p>
                <p>Bi-weekly Zoom/Discord sessions focused on SF worldbuilding and science fiction craft.</p>
              </div>
              <div>
                <p className="text-t2 font-medium mb-1">Course Discounts</p>
                <p>Vanguard Annual saves 25% on all SF worldbuilding courses. Monthly saves 10%. Pro Annual saves 10%, Monthly saves 5%.</p>
              </div>
            </div>
          </GlassPanel>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto">
          <GlassPanel className="p-8">
            <h3 className="font-heading text-xl font-light uppercase tracking-[2px] mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-t1">Is the writing Studio free?</p>
                <p className="text-t2">Yes. The Studio (binder, corkboard, outliner, snapshots), the Codex, the Chronicle, Canon capture and Compile come with every free account. Pro adds instruments and world-level exports; it never locks your manuscript.</p>
              </div>
              <div>
                <p className="font-medium text-t1">Can I cancel anytime?</p>
                <p className="text-t2">Yes. Cancel anytime from your billing portal. You'll keep access until the end of your billing period.</p>
              </div>
              <div>
                <p className="font-medium text-t1">What payment methods do you accept?</p>
                <p className="text-t2">We accept all major credit cards, debit cards, and many local payment methods through Stripe.</p>
              </div>
              <div>
                <p className="font-medium text-t1">Will I lose my data if I cancel?</p>
                <p className="text-t2">No. Your worlds, worksheets and manuscripts remain saved, and the Studio stays open. Pro and Vanguard instruments lock until you resubscribe.</p>
              </div>
              <div>
                <p className="font-medium text-t1">Can I upgrade from Pro to Vanguard?</p>
                <p className="text-t2">Yes. Upgrade anytime. Stripe prorates the billing so you only pay the difference for the remainder of your current period.</p>
              </div>
              <div>
                <p className="font-medium text-t1">Can I switch between monthly and yearly?</p>
                <p className="text-t2">Yes. You can change your plan anytime through the billing portal.</p>
              </div>
              <div>
                <p className="font-medium text-t1">What are roadmap votes?</p>
                <p className="text-t2">Vanguard members get 10 votes per billing period to cast on upcoming tools and features. The highest-voted items get priority in development.</p>
              </div>
            </div>
          </GlassPanel>
        </section>
      </main>

      <Footer />

      {/* Post-checkout welcome dialogs */}
      <WelcomeDialog open={showProWelcome} onOpenChange={setShowProWelcome} variant="pro" />
      <WelcomeDialog open={showVanguardWelcome} onOpenChange={setShowVanguardWelcome} variant="vanguard" />
    </div>
  );
};

export default Pricing;

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, type Subscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import WelcomeDialog from "@/components/onboarding/WelcomeDialog";
import { PRICING, TOTAL_TOOL_COUNT } from "@/lib/tools-config";
import { FREE_PLAN_GROUPS, FREE_PLAN_SUMMARY, PRO_PLAN_ITEMS, VANGUARD_PLAN_ITEMS } from "@/lib/plan-features";
import { Eyebrow, SectionHeading } from "@/components/landing/marketing-ui";
import { cn } from "@/lib/utils";
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
  // adds instruments and world-level exports; Vanguard shapes the roadmap.
  const proFeatures = [
    ...PRO_PLAN_ITEMS,
    `${PRICING.pro.monthly.courseDiscount}–${PRICING.pro.yearly.courseDiscount} off SF courses`,
  ];
  const vanguardFeatures = [
    ...VANGUARD_PLAN_ITEMS,
    `${PRICING.vanguard.monthly.courseDiscount}–${PRICING.vanguard.yearly.courseDiscount} off SF courses`,
  ];

  // Determine if user is on Pro (not Vanguard), show upgrade CTA
  const isProOnly = isSubscribed && tier === 'pro';
  const busy = loading !== null;

  const activatingNotice = (
    <div className="border border-sf-line bg-sf-surface-elevated p-4 text-center">
      <Loader size="sm" className="mb-2" />
      <p className="font-mono text-sf-mono uppercase text-t1">ACTIVATION IN PROGRESS.</p>
    </div>
  );

  const manageButton = (
    <Button variant="sf-ghost" size="sf-md" className="w-full" onClick={handleManageSubscription} disabled={loading === 'portal'}>
      {loading === 'portal' ? <Loader variant="inline" size="sm" className="mr-2" /> : null}
      Manage access
    </Button>
  );

  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] overflow-x-clip px-4 pt-24 pb-16 sm:px-6 md:pt-32">
        {/* Marketing hero (15-PAGE-CHROME: Pricing keeps its own hero and does
            not use PageHeader). Same voice as the landing and Features. */}
        <section aria-labelledby="pricing-title" className="mb-14 md:mb-16">
          <Eyebrow className="mb-6">Access</Eyebrow>
          <h1 id="pricing-title" className="font-display text-[clamp(40px,6vw,72px)] font-light leading-[1.04] text-t1">
            Write the book free.
            <em className="block font-serif font-normal italic text-sf-primary-text">Unlock every instrument.</em>
          </h1>
          <p className="mt-6 max-w-[60ch] font-sans text-[17px] leading-[1.6] text-t2 md:text-[19px]">
            {`The Studio, Codex, Chronicle, Canon and Compile come with every account. Pro opens all ${TOTAL_TOOL_COUNT} instruments and full-world exports. Vanguard shapes what comes next.`}
          </p>
        </section>

        {/* Plans: equal-height columns, CTAs pinned to the bottom edge. */}
        <section aria-label="Plans" className="mb-20 grid items-stretch gap-6 md:grid-cols-3">
          <PlanCard
            name="Free"
            price="$0"
            per="forever"
            note="No credit card."
            intro="The whole writing side of the ship:"
            features={FREE_PLAN_SUMMARY}
          >
            {user && !isSubscribed ? (
              <p className="flex min-h-hit items-center justify-center border border-sf-line font-mono text-sf-mono uppercase text-t3">
                Current plan
              </p>
            ) : user ? null : (
              <Button variant="sf-ghost" size="sf-md" className="w-full" onClick={() => navigate("/auth#create-account")}>
                Start writing free
              </Button>
            )}
          </PlanCard>

          <PlanCard
            name="Pro"
            price={`$${PRICING.pro.monthly.price}`}
            per="month"
            note={`or $${PRICING.pro.yearly.price} a year, save ${PRICING.pro.yearly.savings}`}
            intro="Everything in Free, plus:"
            features={proFeatures}
            recommended
          >
            {activating ? (
              activatingNotice
            ) : isSubscribed && tier === 'pro' ? (
              <div className="space-y-3">
                <p className="flex min-h-hit items-center justify-center gap-2 border border-sf-primary font-mono text-sf-mono uppercase text-sf-primary-text">
                  <Check className="h-4 w-4" aria-hidden />
                  Pro active ({subscription?.plan_type})
                </p>
                {manageButton}
              </div>
            ) : isVanguard ? (
              <p className="flex min-h-hit items-center justify-center border border-sf-line font-mono text-sf-mono uppercase text-t3">
                Included in Vanguard
              </p>
            ) : (
              <div className="space-y-3">
                <Button variant="sf-primary" size="sf-md" className="w-full" onClick={() => handleCheckout('yearly', 'pro')} disabled={busy}>
                  {loading === 'yearly' ? <Loader variant="inline" size="sm" className="mr-2" /> : null}
                  Go yearly, ${PRICING.pro.yearly.price}/yr
                </Button>
                <Button variant="sf-ghost" size="sf-md" className="w-full" onClick={() => handleCheckout('monthly', 'pro')} disabled={busy}>
                  {loading === 'monthly' ? <Loader variant="inline" size="sm" className="mr-2" /> : null}
                  Go monthly, ${PRICING.pro.monthly.price}/mo
                </Button>
              </div>
            )}
          </PlanCard>

          <PlanCard
            name="Vanguard"
            price={`$${PRICING.vanguard.monthly.price}`}
            per="month"
            note={`or $${PRICING.vanguard.yearly.price} a year, save ${PRICING.vanguard.yearly.savings}`}
            intro="Everything in Pro, plus:"
            features={vanguardFeatures}
          >
            {activating ? (
              activatingNotice
            ) : isVanguard ? (
              <div className="space-y-3">
                <p className="flex min-h-hit items-center justify-center gap-2 border border-sf-primary font-mono text-sf-mono uppercase text-sf-primary-text">
                  <Check className="h-4 w-4" aria-hidden />
                  Vanguard active ({subscription?.plan_type})
                </p>
                {manageButton}
              </div>
            ) : (
              <div className="space-y-3">
                <Button variant="sf-ghost" size="sf-md" className="w-full border-sf-primary text-sf-primary-text" onClick={() => handleCheckout('yearly', 'vanguard')} disabled={busy}>
                  {loading === 'vanguard-yearly' ? <Loader variant="inline" size="sm" className="mr-2" /> : null}
                  {isProOnly ? 'Upgrade yearly' : 'Go yearly'}, ${PRICING.vanguard.yearly.price}/yr
                </Button>
                <Button variant="sf-ghost" size="sf-md" className="w-full" onClick={() => handleCheckout('monthly', 'vanguard')} disabled={busy}>
                  {loading === 'vanguard-monthly' ? <Loader variant="inline" size="sm" className="mr-2" /> : null}
                  {isProOnly ? 'Upgrade monthly' : 'Go monthly'}, ${PRICING.vanguard.monthly.price}/mo
                </Button>
                {isProOnly && (
                  <p className="text-center text-xs text-t3">Your Pro plan is upgraded. Stripe prorates the billing.</p>
                )}
              </div>
            )}
          </PlanCard>
        </section>

        {/* Comparison */}
        <section aria-labelledby="compare-title" className="mb-20">
          <SectionHeading id="compare-title" label="Compare" title="Every line, every plan" />
          <ComparisonTable proItems={PRO_PLAN_ITEMS} vanguardItems={VANGUARD_PLAN_ITEMS} />
        </section>

        {/* Vanguard detail */}
        <section aria-labelledby="vanguard-title" className="mb-20 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <SectionHeading
            id="vanguard-title"
            label="Vanguard"
            title="Shape what comes next"
            lede="Vanguard members help build StellarForge: vote on the roadmap, try new tools before anyone else, and join Office Hours on science fiction worldbuilding with the creator."
            className="mb-0 md:mb-0"
          />
          <dl className="grid gap-8 self-end sm:grid-cols-2">
            <div className="border-t border-sf-line pt-4">
              <dt className="mb-2 font-heading text-sf-eyebrow uppercase text-t1">Office Hours</dt>
              <dd className="text-sm leading-[1.6] text-t2">Bi-weekly Zoom and Discord sessions on SF worldbuilding and science fiction craft.</dd>
            </div>
            <div className="border-t border-sf-line pt-4">
              <dt className="mb-2 font-heading text-sf-eyebrow uppercase text-t1">Course discounts</dt>
              <dd className="text-sm leading-[1.6] text-t2">
                {`Vanguard yearly saves ${PRICING.vanguard.yearly.courseDiscount} on SF courses, monthly ${PRICING.vanguard.monthly.courseDiscount}. Pro yearly saves ${PRICING.pro.yearly.courseDiscount}, monthly ${PRICING.pro.monthly.courseDiscount}.`}
              </dd>
            </div>
          </dl>
        </section>

        {/* FAQ */}
        <section aria-labelledby="pricing-faq-title">
          <SectionHeading id="pricing-faq-title" label="Questions" title="Billing, plainly" />
          <div className="max-w-3xl border-t border-sf-line">
            {PRICING_FAQ.map((item) => (
              <details key={item.q} className="group border-b border-sf-line-hairline">
                <summary className="flex min-h-hit cursor-pointer list-none items-center justify-between gap-4 py-4 font-sans text-base font-medium text-t1 transition-colors duration-base hover:text-sf-primary-text [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus className="h-4 w-4 shrink-0 text-t3 transition-transform duration-base ease-sf-out group-open:rotate-45" aria-hidden />
                </summary>
                <p className="pb-5 text-sf-body text-t2 sf-measure">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      {/* Post-checkout welcome dialogs */}
      <WelcomeDialog open={showProWelcome} onOpenChange={setShowProWelcome} variant="pro" />
      <WelcomeDialog open={showVanguardWelcome} onOpenChange={setShowVanguardWelcome} variant="vanguard" />
    </div>
  );
};

const PRICING_FAQ = [
  {
    q: "Is the writing Studio free?",
    a: "Yes. The Studio (binder, corkboard, outliner, snapshots), the Codex, the Chronicle, Canon capture and Compile come with every free account. Pro adds instruments and world-level exports; it never locks your manuscript.",
  },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing portal. You keep access until the end of your billing period." },
  { q: "What payment methods do you accept?", a: "All major credit and debit cards, and many local payment methods, through Stripe." },
  {
    q: "Will I lose my data if I cancel?",
    a: "No. Your worlds, worksheets and manuscripts stay saved, and the Studio stays open. Pro and Vanguard instruments lock until you resubscribe.",
  },
  { q: "Can I upgrade from Pro to Vanguard?", a: "Yes, anytime. Stripe prorates the billing so you only pay the difference for the rest of your current period." },
  { q: "Can I switch between monthly and yearly?", a: "Yes. Change your plan anytime through the billing portal." },
  {
    q: "What are roadmap votes?",
    a: "Vanguard members get 10 votes per billing period to cast on upcoming tools and features. The highest-voted items get priority in development.",
  },
] as const;

interface PlanCardProps {
  name: string;
  price: string;
  per: string;
  note: string;
  intro: string;
  features: readonly string[];
  recommended?: boolean;
  children?: React.ReactNode;
}

/**
 * One plan column. Flex column at full height so the three cards share a
 * height and their CTAs line up on the bottom edge (finding 7).
 */
function PlanCard({ name, price, per, note, intro, features, recommended = false, children }: PlanCardProps): JSX.Element {
  return (
    <article
      aria-label={`${name} plan`}
      className={cn(
        "relative flex h-full flex-col border bg-sf-surface p-6 md:p-8",
        recommended ? "border-sf-primary sf-panel-glow" : "border-sf-line",
      )}
    >
      <header className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-sf-h3 font-normal text-t1">{name}</h2>
          {recommended && (
            <span className="rounded-sf-tag border border-sf-primary px-1.5 font-mono text-sf-mono uppercase text-sf-primary-text">
              Recommended
            </span>
          )}
        </div>
        <p className="font-mono text-[40px] font-light leading-none text-t1">
          {price}
          <span className="ml-1 font-sans text-base text-t3">/ {per}</span>
        </p>
        <p className="mt-2 text-sm text-t3">{note}</p>
      </header>

      <p className="mb-3 text-sm text-t1">{intro}</p>
      <ul className="mb-8 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm leading-[1.5]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-sf-primary-text" aria-hidden />
            <span className="text-t2">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">{children}</div>
    </article>
  );
}

function ComparisonTable({ proItems, vanguardItems }: { proItems: string[]; vanguardItems: string[] }): JSX.Element {
  const rows: { group: string; items: { label: string; plans: [boolean, boolean, boolean] }[] }[] = [
    ...FREE_PLAN_GROUPS.map((g) => ({
      group: g.heading,
      items: g.items.map((label) => ({ label, plans: [true, true, true] as [boolean, boolean, boolean] })),
    })),
    { group: "Pro", items: proItems.map((label) => ({ label, plans: [false, true, true] as [boolean, boolean, boolean] })) },
    { group: "Vanguard", items: vanguardItems.map((label) => ({ label, plans: [false, false, true] as [boolean, boolean, boolean] })) },
  ];
  const mark = (on: boolean) =>
    on ? (
      <>
        <Check className="mx-auto h-4 w-4 text-sf-primary-text" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    ) : (
      <>
        <span aria-hidden className="text-t4">·</span>
        <span className="sr-only">Not included</span>
      </>
    );

  return (
    <div className="sf-sb overflow-x-auto border-t border-sf-line">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-sf-line">
            <th scope="col" className="py-3 pr-4 text-left font-heading text-sf-eyebrow uppercase text-t4">
              <span className="sr-only">Feature</span>
            </th>
            {["Free", "Pro", "Vanguard"].map((p) => (
              <th key={p} scope="col" className="w-24 py-3 text-center font-heading text-sf-eyebrow uppercase text-t1 md:w-32">
                {p}
              </th>
            ))}
          </tr>
        </thead>
        {rows.map((r) => (
          <tbody key={r.group}>
            <tr>
              <th colSpan={4} scope="colgroup" className="pt-6 pb-2 text-left font-heading text-sf-eyebrow uppercase text-t3">
                {r.group}
              </th>
            </tr>
            {r.items.map((it) => (
              <tr key={it.label} className="border-b border-sf-line-hairline">
                <th scope="row" className="py-2.5 pr-4 text-left font-normal text-t2">
                  {it.label}
                </th>
                {it.plans.map((on, i) => (
                  <td key={i} className="py-2.5 text-center">
                    {mark(on)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export default Pricing;

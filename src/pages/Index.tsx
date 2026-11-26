// ---------------------------------------------------------------------------
// "/" — signed out, the marketing landing. Signed in, the writer's home:
// your worlds + continue writing (onboarding review item 2).
//
// The full tool catalog that used to fill the bottom of this page lives at
// /tools now (header Tools menu, footer, ⌘K). Archive and tag filtering
// live on /worlds.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BetaBanner from "@/components/BetaBanner";
import CreateWorldButton from "@/components/dashboard/CreateWorldButton";
import SharedWorldsSection from "@/components/dashboard/SharedWorldsSection";
import ContinueWriting from "@/components/home/ContinueWriting";
import RecentActivityFeed from "@/components/home/RecentActivityFeed";
import WelcomeHero from "@/components/landing/WelcomeHero";
import HowItWorks from "@/components/landing/HowItWorks";
import StudioSection from "@/components/landing/StudioSection";
import InstrumentConstellation from "@/components/landing/InstrumentConstellation";
import VideoShowcase from "@/components/landing/VideoShowcase";
import RecentArticles from "@/components/landing/RecentArticles";
import { FinalCTA, LandingFAQ, PricingTeaser } from "@/components/landing/LandingClosing";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import WelcomeDialog from "@/components/onboarding/WelcomeDialog";
import { PromptOfTheDay } from "@/components/writing/PromptOfTheDay";
import SFDivider from "@/components/ui/sf-divider";
import { PageBursts } from "@/components/ui/data-burst";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useRecentWork } from "@/hooks/use-recent-work";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { ALL_DASHBOARD_BURSTS } from "@/lib/data-bursts";
import { continueTargets, mergeActivity } from "@/lib/recent-work";
import { dismissWelcome, isWelcomeDismissed, shouldShowWelcome } from "@/lib/onboarding/welcome-gate";

const CONTINUE_LIMIT = 6;
const ACTIVITY_LIMIT = 8;

// Section headings (15-PAGE-CHROME §4): the section-header pattern, Jura
// eyebrow over a hairline, the same as the Bridge cockpit (1.6).
const sectionHeading =
  "mb-4 border-b border-sf-line-hairline pb-2 font-heading text-sf-eyebrow uppercase text-t4";

function SignedInHome() {
  const { user } = useAuth();
  const [, setSearchParams] = useSearchParams();
  const { worlds, isLoading, archivedCount } = useWorlds();
  const worldIds = useMemo(() => worlds.map((w) => w.id), [worlds]);
  const { data: recent, isLoading: recentLoading } = useRecentWork(worldIds, {
    enabled: worldIds.length > 0,
  });

  const targets = useMemo(
    () => continueTargets(worlds, recent.docs, CONTINUE_LIMIT),
    [worlds, recent.docs],
  );
  const activity = useMemo(
    () => mergeActivity(recent, new Map(worlds.map((w) => [w.id, w.name])), ACTIVITY_LIMIT),
    [recent, worlds],
  );

  // Signup welcome: a signed-in writer with zero worlds (archived included)
  // who has not dismissed it (lib/onboarding/welcome-gate.ts).
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  useEffect(() => {
    setWelcomeDismissed(isWelcomeDismissed(user?.id));
  }, [user?.id]);
  const showSignupWelcome = shouldShowWelcome({
    userId: user?.id,
    worldsLoaded: !isLoading,
    worldCount: worlds.length + archivedCount,
    dismissed: welcomeDismissed,
  });
  const closeSignupWelcome = (open: boolean) => {
    if (open) return;
    dismissWelcome(user?.id);
    setWelcomeDismissed(true);
  };
  // BEGIN SURVEY opens through CreateWorldButton's ?create=true listener.
  const openBeginSurvey = () => setSearchParams({ create: "true" });

  return (
    <>
      <PageHeader
        size="page"
        eyebrow="Overview"
        title="Home"
        lede="Pick up the scene you left, see what changed across your worlds, and take today's prompt."
        actions={
          <>
            {/* The one CreateWorldButton on this page: it owns BEGIN SURVEY
                and the ?create=true deep link. */}
            <CreateWorldButton variant="button" />
            {/* sm+: two ghost links. Phones: one overflow (1.6 #19), so the
                header never wraps into three rows. */}
            <Button asChild variant="sf-ghost" size="sf-md" className="hidden sm:inline-flex">
              <Link to="/worlds">All worlds</Link>
            </Button>
            <Button asChild variant="sf-ghost" size="sf-md" className="hidden sm:inline-flex">
              <Link to="/tools">All tools</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="sf-ghost" size="icon" className="min-h-hit min-w-hit sm:hidden" aria-label="More">
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/worlds">All worlds</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tools">All tools</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <SubscriptionBanner />

      <section aria-labelledby="home-continue" className="mb-12">
        <h2 id="home-continue" className={sectionHeading}>
          Continue writing
        </h2>
        <ContinueWriting
          targets={targets}
          isLoading={isLoading || (worldIds.length > 0 && recentLoading)}
          onBeginSurvey={openBeginSurvey}
        />
      </section>

      {worlds.length > 0 && (
        <section aria-labelledby="home-activity" className="mb-12">
          <h2 id="home-activity" className={sectionHeading}>
            Recent activity
          </h2>
          <RecentActivityFeed items={activity} />
        </section>
      )}

      <SharedWorldsSection />

      <section aria-labelledby="home-prompt" className="mb-12">
        <h2 id="home-prompt" className={sectionHeading}>
          Today's writing prompt
        </h2>
        <PromptOfTheDay />
      </section>

      <WelcomeDialog
        open={showSignupWelcome}
        onOpenChange={closeSignupWelcome}
        variant="signup"
        onPrimaryAction={openBeginSurvey}
      />
    </>
  );
}

// Signed-out landing (1.6 "Quiet Instrument"): one narrative, one focal
// moment per section. Hero → how it works → the Studio → the instruments →
// video → pricing → questions → begin. The catalog lives at /tools and
// "coming soon" lives at /roadmap.
function SignedOutLanding() {
  return (
    <>
      <WelcomeHero />
      <HowItWorks />
      <StudioSection />
      <InstrumentConstellation />
      <VideoShowcase />
      <PricingTeaser />
      <LandingFAQ />
      <RecentArticles />
      <FinalCTA />
    </>
  );
}

const Index = () => {
  useMetaTags({});
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />
      <div className="pt-16">
        <BetaBanner />
      </div>

      {user ? (
        // Signed in: the standard frame. The banner above already clears the
        // fixed header, so the container drops its own header offset.
        <main className="relative z-10">
          <PageContainer variant="standalone" className="pt-8">
            <PageBursts bursts={ALL_DASHBOARD_BURSTS} />
            <SignedInHome />
            <SFDivider label=",  ··, COMMS: LEARN, ·· , " className="hidden md:block" />
            <RecentArticles />
          </PageContainer>
        </main>
      ) : (
        // Signed out: the marketing landing keeps its own hero and frame.
        <main className="relative z-10 mx-auto w-full max-w-[1200px] overflow-x-clip px-4 pb-8 sm:px-6">
          <SignedOutLanding />
        </main>
      )}

      <Footer />
    </div>
  );
};

export default Index;

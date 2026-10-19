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
import ToolShowcase from "@/components/landing/ToolShowcase";
import ValueProposition from "@/components/landing/ValueProposition";
import VideoShowcase from "@/components/landing/VideoShowcase";
import RecentArticles from "@/components/landing/RecentArticles";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import WelcomeDialog from "@/components/onboarding/WelcomeDialog";
import { PromptOfTheDay } from "@/components/writing/PromptOfTheDay";
import { HomepageQuote } from "@/components/quotes/HomepageQuote";
import { CosmicTelemetry } from "@/components/layout/CosmicVelocityTicker";
import SFDivider from "@/components/ui/sf-divider";
import { PageBursts } from "@/components/ui/data-burst";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useRecentWork } from "@/hooks/use-recent-work";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { COORDINATE_DATA } from "@/lib/cosmic-telemetry";
import { ALL_DASHBOARD_BURSTS } from "@/lib/data-bursts";
import { continueTargets, mergeActivity } from "@/lib/recent-work";
import { dismissWelcome, isWelcomeDismissed, shouldShowWelcome } from "@/lib/onboarding/welcome-gate";

const CONTINUE_LIMIT = 6;
const ACTIVITY_LIMIT = 8;

// Section headings (15-PAGE-CHROME §4): named blocks, display h3.
const sectionHeading = "font-display text-sf-h3 font-light text-t1 mb-6";

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
            <Button asChild variant="sf-ghost" size="sf-md">
              <Link to="/worlds">All worlds</Link>
            </Button>
            <Button asChild variant="sf-ghost" size="sf-md">
              <Link to="/tools">All tools</Link>
            </Button>
          </>
        }
      />

      <SubscriptionBanner />

      <section aria-labelledby="home-continue" className="mb-16">
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
        <section aria-labelledby="home-activity" className="mb-16">
          <h2 id="home-activity" className={sectionHeading}>
            Recent activity
          </h2>
          <RecentActivityFeed items={activity} />
        </section>
      )}

      <SharedWorldsSection />

      <section aria-labelledby="home-prompt" className="mb-16">
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

function SignedOutLanding() {
  return (
    <>
      <WelcomeHero />
      <SFDivider label="·· · SECTOR: WORLDBUILDING · ··" className="hidden md:block" />
      <VideoShowcase />
      <CosmicTelemetry data={COORDINATE_DATA} variant="horizontal" align="center" className="my-8" />
      <HomepageQuote />
      <ToolShowcase />
      <SFDivider />
      <ValueProposition />
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
        <BetaBanner position="top" />
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
        <main className="container mx-auto px-4 pt-8 pb-16 relative z-10">
          <PageBursts bursts={ALL_DASHBOARD_BURSTS} />
          <SignedOutLanding />
          <SFDivider label=",  ··, COMMS: LEARN, ·· , " className="hidden md:block" />
          {/* Latest from Learn - shown to all users */}
          <RecentArticles />
        </main>
      )}

      <BetaBanner position="bottom" />

      <Footer />
    </div>
  );
};

export default Index;

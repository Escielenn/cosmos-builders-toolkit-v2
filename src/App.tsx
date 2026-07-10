// Side-effect import: registers a handler that auto-reloads the page when a
// dynamic chunk fails to fetch (long-lived tab on a previous deploy).
import "@/lib/preload-error-recovery";

import { Suspense, lazy } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BackgroundProvider } from "@/hooks/use-background";
import { AudioProvider } from "@/hooks/use-audio-player";
import AudioPlayer from "@/components/audio/AudioPlayer";
import ScrollToTop from "./components/ScrollToTop";
import FABStack from "./components/layout/FABStack";
import CookieConsent from "./components/common/CookieConsent";
import TextureOverlay from "./components/layout/TextureOverlay";
import DataBurstOverlay from "./components/layout/DataBurstOverlay";
import VideoBackground from "./components/layout/VideoBackground";
import { StellarBackground } from "./components/layout/StellarBackground";
import { KonamiCode } from "./components/ambient/KonamiCode";
import StatusBar from "./components/layout/StatusBar";
import { Loader } from "@/components/ui/loader";
import { getLoadingMessage } from "@/lib/loading-messages";
import ErrorBoundary from "./components/ErrorBoundary";
import SiteGate from "./components/auth/SiteGate";
import { BadgeProvider } from "./contexts/BadgeContext";
import { BadgeEarnedDialog } from "./components/badges/BadgeEarnedDialog";
import { useBadgeEvaluator } from "./hooks/use-badge-evaluator";
import { useAuth } from "./contexts/AuthContext";

// Eagerly loaded pages (small, frequently accessed)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

// Lazy loaded pages (larger, less frequently accessed)
const Profile = lazy(() => import("./pages/Profile"));
const Pricing = lazy(() => import("./pages/Pricing"));
const EarlyAccess = lazy(() => import("./pages/EarlyAccess"));
const Studio = lazy(() => import("./pages/Studio"));
const Write = lazy(() => import("./pages/Write"));
const WriteIndex = lazy(() => import("./pages/Write").then((m) => ({ default: m.WriteIndex })));
const WorldWriteRedirect = lazy(() => import("./pages/Write").then((m) => ({ default: m.WorldWriteRedirect })));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Features = lazy(() => import("./pages/Features"));
const Guide = lazy(() => import("./pages/Guide"));
const FieldManual = lazy(() => import("./pages/FieldManual"));
const ToolsWiki = lazy(() => import("./pages/ToolsWiki"));
const GettingStarted = lazy(() => import("./pages/GettingStarted"));
const Contact = lazy(() => import("./pages/Contact"));
const WorldDashboard = lazy(() => import("./pages/WorldDashboard"));
const WorldConnections = lazy(() => import("./pages/WorldConnections"));
const Worlds = lazy(() => import("./pages/Worlds"));
const WorldLayout = lazy(() => import("./layouts/WorldLayout"));
const WorldToolPage = lazy(() => import("./pages/WorldToolPage"));
const WorldGraph = lazy(() => import("./pages/WorldGraph"));
const WikiPageRoute = lazy(() => import("./pages/WikiPageRoute"));
const WorldChronicle = lazy(() => import("./pages/WorldChronicle"));
const WorldWritingSpace = lazy(() => import("./pages/WorldWritingSpace"));
const WorldCustomTypes = lazy(() => import("./pages/WorldCustomTypes"));
const WorldCompile = lazy(() => import("./pages/WorldCompile"));
const WikiBrowse = lazy(() => import("./pages/WikiBrowse"));
const Collection = lazy(() => import("./pages/Collection"));
const Archive = lazy(() => import("./pages/Archive"));
const Commendations = lazy(() => import("./pages/Commendations"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const WorldShowcase = lazy(() => import("./pages/WorldShowcase"));
const Community = lazy(() => import("./pages/Community"));

// Lazy loaded tool pages (heavy, only loaded when accessed)
const EnvironmentalChainReaction = lazy(() => import("./pages/tools/EnvironmentalChainReaction"));
const PropulsionConsequencesMap = lazy(() => import("./pages/tools/PropulsionConsequencesMap"));
const SpacecraftDesigner = lazy(() => import("./pages/tools/SpacecraftDesigner"));
const PlanetaryProfile = lazy(() => import("./pages/tools/PlanetaryProfile"));
const DrakeEquationCalculator = lazy(() => import("./pages/tools/DrakeEquationCalculator"));
const XenomythologyFrameworkBuilder = lazy(() => import("./pages/tools/XenomythologyFrameworkBuilder"));
const EvolutionaryBiology = lazy(() => import("./pages/tools/EvolutionaryBiology"));
const StarSystemBuilder = lazy(() => import("./pages/tools/StarSystemBuilder"));
const EmpireDesigner = lazy(() => import("./pages/tools/EmpireDesigner"));
const TechnologyConsequences = lazy(() => import("./pages/tools/TechnologyConsequences"));
const SpeciesInteractionMatrix = lazy(() => import("./pages/tools/SpeciesInteractionMatrix"));
const OneBigLie = lazy(() => import("./pages/tools/OneBigLie"));
const TimeDilationCalculator = lazy(() => import("./pages/tools/TimeDilationCalculator"));
const SpaceExpansionModeler = lazy(() => import("./pages/tools/SpaceExpansionModeler"));
const HabitableZoneCalculator = lazy(() => import("./pages/tools/HabitableZoneCalculator"));
const LexDrift = lazy(() => import("./pages/tools/LexDrift"));
const SurfaceGravityCalculator = lazy(() => import("./pages/tools/SurfaceGravityCalculator"));
const TimelineTool = lazy(() => import("./pages/tools/Timeline"));
const Sensorium = lazy(() => import("./pages/tools/Sensorium"));
const Gravitas = lazy(() => import("./pages/tools/Gravitas"));
const KardashevScale = lazy(() => import("./pages/tools/KardashevScale"));

// Lazy loaded learn pages
const LearnIndex = lazy(() => import("./pages/learn/LearnIndex"));
const LearnArticle = lazy(() => import("./pages/learn/LearnArticle"));

// Lazy loaded content pages
const Bookshelf = lazy(() => import("./pages/Bookshelf"));
const WritingWorkshop = lazy(() => import("./pages/WritingWorkshop"));
const PromptBrowser = lazy(() => import("./pages/PromptBrowser"));

// Lazy loaded utility pages
const NotionCallback = lazy(() => import("./pages/NotionCallback"));

// Lazy loaded share pages (public, no auth required)
const SharedWorksheetView = lazy(() => import("./pages/SharedWorksheetView"));
const SharedWorldView = lazy(() => import("./pages/SharedWorldView"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const Join = lazy(() => import("./pages/Join"));

// Lazy loaded simulator wrapper pages
const RogueSimulator = lazy(() => import("./pages/simulators/RogueSimulator"));
const RogueScience = lazy(() => import("./pages/simulators/RogueScience"));
const TidelockSimulator = lazy(() => import("./pages/simulators/TidelockSimulator"));
const TidelockScience = lazy(() => import("./pages/simulators/TidelockScience"));
const ExoskySimulator = lazy(() => import("./pages/simulators/ExoskySimulator"));
const ExoskyScience = lazy(() => import("./pages/simulators/ExoskyScience"));
const ExoforgeSimulator = lazy(() => import("./pages/simulators/ExoforgeSimulator"));
const ExoforgeScience = lazy(() => import("./pages/simulators/ExoforgeScience"));
const SolarisSimulator = lazy(() => import("./pages/simulators/SolarisSimulator"));

// Lazy loaded cartographer wrapper pages
const StellarCartographer = lazy(() => import("./pages/cartographers/StellarCartographer"));

// Lazy loaded admin page
const Admin = lazy(() => import("./pages/Admin"));

// Lazy loaded legal pages
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Credits = lazy(() => import("./pages/legal/Credits"));
const Changelog = lazy(() => import("./pages/legal/Changelog"));

// Lazy loaded guard (includes subscription logic)
const ProToolGuard = lazy(() => import("./components/subscription/ProToolGuard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min, don't refetch unless stale
      gcTime: 10 * 60 * 1000,     // 10 min garbage collection
      refetchOnWindowFocus: false, // stop redundant Supabase calls on tab switch
      retry: 1,
    },
  },
});

// Loading fallback, sf-loading-screen with bracket corners + Ship's Voice message
const PageLoader = () => (
  <div className="sf-loading-screen" role="alert" aria-live="polite">
    <div className="sf-loading-frame">
      <span className="sf-loading-message">{getLoadingMessage(window.location.pathname)}</span>
      <div className="h-5" />
      <Loader />
      <div className="h-4" />
      <div className="sf-loading-bar">
        <div className="sf-loading-bar-fill" />
      </div>
    </div>
  </div>
);

/** Mounts the badge evaluator hook, only renders when user is logged in */
function BadgeEvaluatorMount() {
  const { user } = useAuth();
  useBadgeEvaluator();
  if (!user) return null;
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BadgeProvider>
      <BackgroundProvider>
      <AudioProvider>
        <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <StellarBackground />
            <KonamiCode />
            <VideoBackground />
            <BadgeEvaluatorMount />
            <BadgeEarnedDialog />
            <ErrorBoundary>
            <SiteGate>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* Public launch waitlist (Cowork Implementation Guide §2) */}
                <Route path="/early" element={<EarlyAccess />} />
                {/* Writer-register studio home (Cowork Implementation Guide §3) */}
                <Route path="/studio" element={<Studio />} />
                {/* Manuscript editor (Implementation Guide §4) */}
                <Route path="/write" element={<WriteIndex />} />
                <Route path="/write/:docId" element={<Write />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/features" element={<Features />} />
                <Route path="/guide" element={<Guide />} />
                <Route path="/guide/field-manual" element={<FieldManual />} />
                <Route path="/guide/tools" element={<ToolsWiki />} />
                <Route path="/getting-started" element={<GettingStarted />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/commendations" element={<Commendations />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/community" element={<Community />} />
                <Route path="/worlds" element={<Worlds />} />
                {/* Public world showcase, outside WorldLayout (no sidebar) */}
                <Route path="/worlds/:worldId/showcase" element={<WorldShowcase />} />
                {/* World routes, nested under WorldLayout (Codex sidebar) */}
                <Route path="/worlds/:worldId" element={<WorldLayout />}>
                  <Route index element={<WorldDashboard />} />
                  <Route path="tools/:toolName" element={<WorldToolPage />} />
                  <Route path="pages/:entryId" element={<WikiPageRoute />} />
                  <Route path="wiki" element={<WikiBrowse />} />
                  <Route path="chronicle" element={<WorldChronicle />} />
                  <Route path="graph" element={<WorldGraph />} />
                  <Route path="connections" element={<WorldConnections />} />
                  {/* Legacy Writing Space unified into Studio (redirects) */}
                  <Route path="write" element={<WorldWriteRedirect />} />
                  <Route path="custom-types" element={<WorldCustomTypes />} />
                  <Route path="compile" element={<WorldCompile />} />
                </Route>
                <Route path="/bookshelf" element={<Bookshelf />} />
                {/* Writing Prompts - Pro gated */}
                <Route
                  path="/workshop"
                  element={
                    <ProToolGuard toolId="writing-workshop">
                      <WritingWorkshop />
                    </ProToolGuard>
                  }
                />
                {/* Prompt Browser */}
                <Route path="/prompts" element={<PromptBrowser />} />
                {/* Free Tools */}
                <Route path="/tools/environmental-chain-reaction" element={<EnvironmentalChainReaction />} />
                <Route path="/tools/propulsion-consequences-map" element={<PropulsionConsequencesMap />} />
                <Route path="/tools/spacecraft-designer" element={<SpacecraftDesigner />} />
                {/* Pro Tools - wrapped with ProToolGuard */}
                <Route
                  path="/tools/planetary-profile"
                  element={
                    <ProToolGuard toolId="planetary-profile">
                      <PlanetaryProfile />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/drake-equation-calculator"
                  element={
                    <ProToolGuard toolId="drake-equation-calculator">
                      <DrakeEquationCalculator />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/xenomythology-framework-builder"
                  element={
                    <ProToolGuard toolId="xenomythology-framework-builder">
                      <XenomythologyFrameworkBuilder />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/evolutionary-biology"
                  element={
                    <ProToolGuard toolId="evolutionary-biology">
                      <EvolutionaryBiology />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/star-system-builder"
                  element={
                    <ProToolGuard toolId="star-system-builder">
                      <StarSystemBuilder />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/empire-designer"
                  element={
                    <ProToolGuard toolId="empire-designer">
                      <EmpireDesigner />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/technology-consequences"
                  element={
                    <ProToolGuard toolId="technology-consequences">
                      <TechnologyConsequences />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/species-interaction-matrix"
                  element={
                    <ProToolGuard toolId="species-interaction-matrix">
                      <SpeciesInteractionMatrix />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/one-big-lie"
                  element={
                    <ProToolGuard toolId="one-big-lie">
                      <OneBigLie />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/time-dilation"
                  element={
                    <ProToolGuard toolId="time-dilation">
                      <TimeDilationCalculator />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/space-expansion-modeler"
                  element={
                    <ProToolGuard toolId="space-expansion-modeler">
                      <SpaceExpansionModeler />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/habitable-zone-calculator"
                  element={
                    <ProToolGuard toolId="habitable-zone-calculator">
                      <HabitableZoneCalculator />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/lexdrift"
                  element={
                    <ProToolGuard toolId="lexdrift">
                      <LexDrift />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/surface-gravity-calculator"
                  element={
                    <ProToolGuard toolId="surface-gravity-calculator">
                      <SurfaceGravityCalculator />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/timeline"
                  element={
                    <ProToolGuard toolId="timeline">
                      <TimelineTool />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/sensorium"
                  element={
                    <ProToolGuard toolId="sensorium">
                      <Sensorium />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/gravitas"
                  element={
                    <ProToolGuard toolId="gravitas">
                      <Gravitas />
                    </ProToolGuard>
                  }
                />
                <Route
                  path="/tools/kardashev-scale"
                  element={
                    <ProToolGuard toolId="kardashev-scale">
                      <KardashevScale />
                    </ProToolGuard>
                  }
                />
                {/* Learn Section */}
                <Route path="/learn" element={<LearnIndex />} />
                <Route path="/learn/:slug" element={<LearnArticle />} />
                {/* OAuth Callbacks */}
                <Route path="/api/notion/callback" element={<NotionCallback />} />
                {/* Shared/Public Views */}
                <Route path="/share/worksheet/:token" element={<SharedWorksheetView />} />
                <Route path="/share/world/:token" element={<SharedWorldView />} />
                <Route path="/invite/:token" element={<InviteAccept />} />
                <Route path="/join/:code" element={<Join />} />
                {/* Simulator Wrapper Pages - Pro gated */}
                <Route
                  path="/rogue"
                  element={
                    <ProToolGuard toolId="rogue">
                      <RogueSimulator />
                    </ProToolGuard>
                  }
                />
                <Route path="/rogue/science" element={<RogueScience />} />
                <Route
                  path="/tools/tidelock"
                  element={
                    <ProToolGuard toolId="tidelock">
                      <TidelockSimulator />
                    </ProToolGuard>
                  }
                />
                <Route path="/tools/tidelock/science" element={<TidelockScience />} />
                <Route
                  path="/tools/exosky"
                  element={
                    <ProToolGuard toolId="exosky">
                      <ExoskySimulator />
                    </ProToolGuard>
                  }
                />
                <Route path="/tools/exosky/science" element={<ExoskyScience />} />
                <Route
                  path="/tools/exoforge"
                  element={
                    <ProToolGuard toolId="exoforge">
                      <ExoforgeSimulator />
                    </ProToolGuard>
                  }
                />
                <Route path="/tools/exoforge/science" element={<ExoforgeScience />} />
                <Route
                  path="/tools/solaris"
                  element={
                    <ProToolGuard toolId="solaris">
                      <SolarisSimulator />
                    </ProToolGuard>
                  }
                />
                {/* Cartographer Wrapper Pages - Pro gated */}
                <Route
                  path="/tools/stellar-cartographer"
                  element={
                    <ProToolGuard toolId="stellar-cartographer">
                      <StellarCartographer />
                    </ProToolGuard>
                  }
                />
                {/* Legal Pages */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/changelog" element={<Changelog />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </SiteGate>
            </ErrorBoundary>
            <FABStack />
            <CookieConsent />
            <TextureOverlay />
            <DataBurstOverlay />
            <StatusBar />
            <AudioPlayer />
          </BrowserRouter>
        </TooltipProvider>
        </MotionConfig>
      </AudioProvider>
      </BackgroundProvider>
      </BadgeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

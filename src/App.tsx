import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import BackgroundProvider from "@/components/providers/BackgroundProvider";
import ScrollToTop from "./components/ScrollToTop";
import { Loader2 } from "lucide-react";

// Eagerly loaded pages (small, frequently accessed)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

// Lazy loaded pages (larger, less frequently accessed)
const Profile = lazy(() => import("./pages/Profile"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Features = lazy(() => import("./pages/Features"));
const WorldDashboard = lazy(() => import("./pages/WorldDashboard"));
const WorldConnections = lazy(() => import("./pages/WorldConnections"));

// Lazy loaded tool pages (heavy, only loaded when accessed)
const EnvironmentalChainReaction = lazy(() => import("./pages/tools/EnvironmentalChainReaction"));
const PropulsionConsequencesMap = lazy(() => import("./pages/tools/PropulsionConsequencesMap"));
const SpacecraftDesigner = lazy(() => import("./pages/tools/SpacecraftDesigner"));
const PlanetaryProfile = lazy(() => import("./pages/tools/PlanetaryProfile"));
const DrakeEquationCalculator = lazy(() => import("./pages/tools/DrakeEquationCalculator"));
const XenomythologyFrameworkBuilder = lazy(() => import("./pages/tools/XenomythologyFrameworkBuilder"));
const EvolutionaryBiology = lazy(() => import("./pages/tools/EvolutionaryBiology"));

// Lazy loaded learn pages
const LearnIndex = lazy(() => import("./pages/learn/LearnIndex"));
const LearnArticle = lazy(() => import("./pages/learn/LearnArticle"));

// Lazy loaded guard (includes subscription logic)
const ProToolGuard = lazy(() => import("./components/subscription/ProToolGuard"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BackgroundProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/features" element={<Features />} />
                <Route path="/worlds/:worldId" element={<WorldDashboard />} />
                <Route path="/worlds/:worldId/connections" element={<WorldConnections />} />
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
                {/* Learn Section */}
                <Route path="/learn" element={<LearnIndex />} />
                <Route path="/learn/:slug" element={<LearnArticle />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </BackgroundProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

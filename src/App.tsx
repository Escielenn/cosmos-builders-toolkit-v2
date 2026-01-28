import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import WorldDashboard from "./pages/WorldDashboard";
import EnvironmentalChainReaction from "./pages/tools/EnvironmentalChainReaction";
import PropulsionConsequencesMap from "./pages/tools/PropulsionConsequencesMap";
import SpacecraftDesigner from "./pages/tools/SpacecraftDesigner";
import PlanetaryProfile from "./pages/tools/PlanetaryProfile";
import DrakeEquationCalculator from "./pages/tools/DrakeEquationCalculator";
import XenomythologyFrameworkBuilder from "./pages/tools/XenomythologyFrameworkBuilder";
import EvolutionaryBiology from "./pages/tools/EvolutionaryBiology";
import LearnIndex from "./pages/learn/LearnIndex";
import LearnArticle from "./pages/learn/LearnArticle";
import ProToolGuard from "./components/subscription/ProToolGuard";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/worlds/:worldId" element={<WorldDashboard />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

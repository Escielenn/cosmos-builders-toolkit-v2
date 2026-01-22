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
import WorldDashboard from "./pages/WorldDashboard";
import EnvironmentalChainReaction from "./pages/tools/EnvironmentalChainReaction";
import PropulsionConsequencesMap from "./pages/tools/PropulsionConsequencesMap";
import SpacecraftDesigner from "./pages/tools/SpacecraftDesigner";
import PlanetaryProfile from "./pages/tools/PlanetaryProfile";
import LearnIndex from "./pages/learn/LearnIndex";
import LearnArticle from "./pages/learn/LearnArticle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/worlds/:worldId" element={<WorldDashboard />} />
            <Route path="/tools/environmental-chain-reaction" element={<EnvironmentalChainReaction />} />
            <Route path="/tools/propulsion-consequences-map" element={<PropulsionConsequencesMap />} />
            <Route path="/tools/spacecraft-designer" element={<SpacecraftDesigner />} />
            <Route path="/tools/planetary-profile" element={<PlanetaryProfile />} />
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

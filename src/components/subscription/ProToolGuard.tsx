import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { isProTool } from "@/lib/tools-config";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { useBackground } from "@/hooks/use-background";

interface ProToolGuardProps {
  toolId: string;
  children: ReactNode;
}

const ProToolGuard = ({ toolId, children }: ProToolGuardProps) => {
  useBackground();
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const navigate = useNavigate();

  const isPro = isProTool(toolId);

  // If not a pro tool, render children directly
  if (!isPro) {
    return <>{children}</>;
  }

  // Show loading state
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If subscribed, render children
  if (isSubscribed) {
    return <>{children}</>;
  }

  // Show upgrade prompt
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
        <GlassPanel className="max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="font-display text-2xl font-bold mb-2">
            Pro Tool
          </h1>

          <p className="text-muted-foreground mb-6">
            This tool is part of the Pro subscription. Upgrade to access all worldbuilding tools and unlock your creative potential.
          </p>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate("/pricing")}
            >
              <Crown className="w-4 h-4" />
              View Pricing
            </Button>

            {!user && (
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Pro includes:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>All 8+ worldbuilding tools</li>
              <li>Unlimited worlds and worksheets</li>
              <li>Cloud sync across devices</li>
              <li>Future tools and features</li>
            </ul>
          </div>
        </GlassPanel>
      </main>
    </div>
  );
};

export default ProToolGuard;

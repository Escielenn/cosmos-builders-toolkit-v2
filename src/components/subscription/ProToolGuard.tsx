import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { isProTool, isEarlyAccessTool } from "@/lib/tools-config";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Lock, Zap, Clock, Sparkles } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";

interface ProToolGuardProps {
  toolId: string;
  children: ReactNode;
}

const ProToolGuard = ({ toolId, children }: ProToolGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subLoading, hasLapsedSubscription, isVanguard } = useSubscription();
  const navigate = useNavigate();

  const isPro = isProTool(toolId);
  const isEarlyAccess = isEarlyAccessTool(toolId);

  // If not a pro or early-access tool, render children directly
  if (!isPro && !isEarlyAccess) {
    return <>{children}</>;
  }

  // Show loading state
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Early access tools require Vanguard tier
  if (isEarlyAccess && !isVanguard) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <GlassPanel className="max-w-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-sm bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-sf-violet" />
            </div>

            <h1 className="font-heading text-2xl font-light tracking-[0.12em] mb-2">
              VANGUARD EARLY ACCESS
            </h1>

            <p className="text-t3 mb-2">
              This instrument is in early access, available exclusively to Vanguard members.
            </p>
            <p className="text-sm text-tier-3 mb-6">
              Vanguard members get new tools first, vote on the roadmap, and more.
            </p>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => navigate("/pricing")}
              >
                <Sparkles className="w-4 h-4" />
                UPGRADE TO VANGUARD
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Back to Dashboard
              </Button>
            </div>
          </GlassPanel>
        </main>
      </div>
    );
  }

  // If subscribed (Pro or Vanguard), render children
  if (isSubscribed) {
    return <>{children}</>;
  }

  // Lapsed subscriber — warmer re-subscribe message
  if (hasLapsedSubscription && user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <GlassPanel className="max-w-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-sm bg-primary/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>

            <h1 className="font-heading text-2xl font-light tracking-[0.12em] mb-2">
              ACCESS EXPIRED
            </h1>

            <p className="text-t3 mb-2">
              Your Pro subscription has ended, but your worlds and worksheets are exactly where you left them.
            </p>
            <p className="text-sm text-tier-3 mb-6">
              Resubscribe to pick up right where you left off.
            </p>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => navigate("/pricing")}
              >
                <Zap className="w-4 h-4" />
                RESUBSCRIBE
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Back to Dashboard
              </Button>
            </div>
          </GlassPanel>
        </main>
      </div>
    );
  }

  // Never subscribed — upgrade prompt
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
        <GlassPanel className="max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-sm bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-sf-amber" />
          </div>

          <h1 className="font-heading text-2xl font-light tracking-[0.12em] mb-2">
            RESTRICTED INSTRUMENT
          </h1>

          <p className="text-t3 mb-6">
            This instrument requires Pro clearance. Upgrade to access the full manifest.
          </p>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate("/pricing")}
            >
              <Zap className="w-4 h-4" />
              VIEW CLEARANCE TIERS
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
            <p className="text-xs text-t3 mb-2">Pro includes:</p>
            <ul className="text-xs text-t3 space-y-1">
              <li>All 25 worldbuilding instruments</li>
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
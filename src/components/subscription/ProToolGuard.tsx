import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { getToolAccess, PRO_TOOL_COUNT } from "@/lib/tools-config";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Lock, Zap, Clock, Sparkles } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";

interface ProToolGuardProps {
  toolId: string;
  children: ReactNode;
}

/**
 * Page chrome for the lock screens. Standalone routes get the full page with
 * Header; inside WorldLayout (which already draws Header + Codex sidebar) the
 * panel renders in the content column only, so the world stays in view.
 */
function GuardShell({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  if (embedded) {
    return (
      <div className="sf-tool-content flex items-center justify-center py-16">
        {children}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-sf-void">
      <Header />
      <main id="main" tabIndex={-1} className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}

const ProToolGuard = ({ toolId, children }: ProToolGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subLoading, hasLapsedSubscription, isVanguard } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const world = useWorldLayoutContext();

  const access = getToolAccess(toolId);
  const isEarlyAccess = access === "early-access";
  const embedded = world !== null;
  const backTo = world ? `/worlds/${world.worldId}` : "/";
  const backLabel = world ? "Return to World" : "Return to Bridge";
  const here = `${location.pathname}${location.search}`;
  const signInTo = `/auth?tab=login&redirect=${encodeURIComponent(here)}`;

  // Free tools render directly
  if (access === "free") {
    return <>{children}</>;
  }

  // Show loading state
  if (authLoading || subLoading) {
    return embedded ? (
      <div className="flex items-center justify-center h-64">
        <Loader size="sm" />
      </div>
    ) : (
      <div className="min-h-screen bg-sf-void flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Early access tools require Vanguard tier
  if (isEarlyAccess && !isVanguard) {
    return (
      <GuardShell embedded={embedded}>
          <GlassPanel className="max-w-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-none bg-sf-violet/[0.06] border border-sf-violet flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-sf-violet" />
            </div>

            <h1 className="font-heading text-2xl font-light tracking-wide text-t1 mb-2">
              VANGUARD EARLY ACCESS
            </h1>

            <p className="text-t2 mb-2">
              This instrument is in early access, available exclusively to Vanguard members.
            </p>
            <p className="text-sm text-t2 mb-6">
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

              <div className="flex justify-center">
                <BackLink to={backTo} label={backLabel} />
              </div>
            </div>
          </GlassPanel>
      </GuardShell>
    );
  }

  // If subscribed (Pro or Vanguard), render children
  if (isSubscribed) {
    return <>{children}</>;
  }

  // Lapsed subscriber, warmer re-subscribe message
  if (hasLapsedSubscription && user) {
    return (
      <GuardShell embedded={embedded}>
          <GlassPanel className="max-w-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-none bg-sf-primary/[0.06] border border-sf-primary flex items-center justify-center">
              <Clock className="w-8 h-8 text-sf-primary-text" />
            </div>

            <h1 className="font-heading text-2xl font-light tracking-wide text-t1 mb-2">
              ACCESS EXPIRED
            </h1>

            <p className="text-t2 mb-2">
              Your Pro Access has ended, but your worlds and worksheets are exactly where you left them.
            </p>
            <p className="text-sm text-t2 mb-6">
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

              <div className="flex justify-center">
                <BackLink to={backTo} label={backLabel} />
              </div>
            </div>
          </GlassPanel>
      </GuardShell>
    );
  }

  // Never subscribed, upgrade prompt
  return (
    <GuardShell embedded={embedded}>
        <GlassPanel className="max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-none bg-sf-amber/[0.06] border border-sf-amber flex items-center justify-center">
            <Lock className="w-8 h-8 text-sf-amber-text" />
          </div>

          <h1 className="font-heading text-2xl font-light tracking-wide text-t1 mb-2">
            RESTRICTED INSTRUMENT
          </h1>

          <p className="text-t2 mb-6">
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
                onClick={() => navigate(signInTo)}
              >
                SIGN IN
              </Button>
            )}

            <div className="flex justify-center">
              <BackLink to={backTo} label={backLabel} />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-sf-line-hairline">
            <p className="font-heading text-sf-eyebrow uppercase text-t4 mb-2">Pro includes</p>
            <ul className="text-sm text-t2 space-y-1">
              <li>All {PRO_TOOL_COUNT} Pro worldbuilding tools</li>
              <li>Unlimited worlds and worksheets</li>
              <li>Cloud sync across devices</li>
              <li>Future tools and features</li>
            </ul>
          </div>
        </GlassPanel>
    </GuardShell>
  );
};

export default ProToolGuard;
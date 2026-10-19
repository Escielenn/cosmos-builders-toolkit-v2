import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, Globe } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import SharedPageHeader from "@/components/sharing/SharedPageHeader";
import { PageHeader } from "@/components/layout/page-chrome";
import { useAuth } from "@/contexts/AuthContext";
import { useAcceptInvite } from "@/hooks/use-collaborators";
import { PageBursts } from "@/components/ui/data-burst";
import { INVITE_ACCEPT_BURSTS } from "@/lib/data-bursts";
import { useMetaTags } from "@/hooks/use-meta-tags";

const InviteAccept = () => {
  useMetaTags({ title: "Invitation" });
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const acceptInvite = useAcceptInvite();
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (authLoading || !token || attempted) return;

    if (user) {
      setAttempted(true);
      acceptInvite.mutate(token);
    }
  }, [user, authLoading, token, attempted]);

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="relative min-h-screen bg-background">
        <SharedPageHeader />
        <PageBursts bursts={INVITE_ACCEPT_BURSTS} />
        <main className="container mx-auto px-4 py-16 max-w-md relative z-10">
          <GlassPanel className="p-8 text-center">
            <PageHeader
              size="card"
              align="center"
              icon={<Globe className="w-12 h-12 text-sf-primary-text" aria-hidden />}
              eyebrow="INVITATION"
              title="World invitation"
              lede="Sign in to accept this invitation and start collaborating."
            />
            <Button asChild>
              <Link to={`/auth?redirect=/invite/${token}`}>
                Sign in to accept
              </Link>
            </Button>
          </GlassPanel>
        </main>
      </div>
    );
  }

  // Loading / accepting
  if (authLoading || acceptInvite.isPending) {
    return (
      <div className="relative min-h-screen bg-background">
        <SharedPageHeader />
        <PageBursts bursts={INVITE_ACCEPT_BURSTS} />
        <main className="container mx-auto px-4 py-16 max-w-md relative z-10">
          <div className="flex flex-col items-center justify-center py-16">
            <Loader className="mb-4" />
            <p className="text-sm text-t2">Accepting invitation...</p>
          </div>
        </main>
      </div>
    );
  }

  // Success
  if (acceptInvite.isSuccess) {
    const result = acceptInvite.data;
    return (
      <div className="relative min-h-screen bg-background">
        <SharedPageHeader />
        <PageBursts bursts={INVITE_ACCEPT_BURSTS} />
        <main className="container mx-auto px-4 py-16 max-w-md relative z-10">
          <GlassPanel className="p-8 text-center">
            <PageHeader
              size="card"
              align="center"
              accent="emerald"
              icon={<CheckCircle2 className="w-12 h-12 text-sf-emerald" aria-hidden />}
              eyebrow="INVITATION"
              title={
                result.already_member
                  ? "Already a collaborator"
                  : result.is_owner
                    ? "This is your world"
                    : "Invitation accepted"
              }
              lede={
                result.already_member
                  ? "You already have access to this world."
                  : result.is_owner
                    ? "You own this world, no invite needed."
                    : `You now have ${result.role} access to this world.`
              }
            />
            <Button onClick={() => navigate(`/worlds/${result.world_id}`)}>
              Go to World
            </Button>
          </GlassPanel>
        </main>
      </div>
    );
  }

  // Error
  return (
    <div className="relative min-h-screen bg-background">
      <SharedPageHeader />
      <PageBursts bursts={INVITE_ACCEPT_BURSTS} />
      <main className="container mx-auto px-4 py-16 max-w-md relative z-10">
        <GlassPanel className="p-8 text-center">
          <PageHeader
            size="card"
            align="center"
            accent="crimson"
            icon={<AlertCircle className="w-12 h-12 text-t3" aria-hidden />}
            eyebrow="INVITATION"
            title="Invitation unavailable"
            lede={
              acceptInvite.error?.message ||
              "This invite may have expired, been cancelled, or was sent to a different email address."
            }
          />
          <Button asChild>
            <Link to="/">Go to StellarForge</Link>
          </Button>
        </GlassPanel>
      </main>
    </div>
  );
};

export default InviteAccept;

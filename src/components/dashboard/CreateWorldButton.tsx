import { useEffect, useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AuthRequiredDialog from "@/components/auth/AuthRequiredDialog";
import BeginSurveyDialog, { type EmptyWorldInput } from "@/components/onboarding/BeginSurveyDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useNavigate, useSearchParams } from "react-router-dom";

const SOVEREIGNTY_SHOWN_KEY = "sf-sovereignty-shown";

interface CreateWorldButtonProps {
  /** "card" is the dashed grid tile; "button" is a BEGIN SURVEY action. */
  variant?: "card" | "button";
  className?: string;
}

const CreateWorldButton = ({ variant = "card", className }: CreateWorldButtonProps = {}) => {
  const { user, loading: authLoading } = useAuth();
  const { createWorld } = useWorlds();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [createdWorldId, setCreatedWorldId] = useState<string | null>(null);

  const handleClick = () => {
    if (user) {
      setShowCreateDialog(true);
    } else {
      setShowAuthDialog(true);
    }
  };

  // Every "Create New World" entry point outside this component (header nav,
  // ⌘K search) has nowhere else to open a dialog it doesn't own, so they all
  // just deep-link here with ?create=true instead. Without this effect that
  // param did nothing — the writer landed on /worlds and had to find and
  // click this exact card themselves.
  useEffect(() => {
    if (authLoading || searchParams.get("create") !== "true") return;
    const next = new URLSearchParams(searchParams);
    next.delete("create");
    setSearchParams(next, { replace: true });
    handleClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, authLoading]);

  const handleCreate = async ({ name, icon, description }: EmptyWorldInput) => {
    if (!name.trim()) return;

    let world;
    try {
      world = await createWorld.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
      });
    } catch {
      return; // useWorlds already reported it; keep the dialog open to retry
    }

    setShowCreateDialog(false);

    // Show sovereignty welcome on first world creation
    try {
      if (!localStorage.getItem(SOVEREIGNTY_SHOWN_KEY)) {
        localStorage.setItem(SOVEREIGNTY_SHOWN_KEY, "true");
        setCreatedWorldId(world.id);
        setShowWelcome(true);
        return;
      }
    } catch {
      // localStorage unavailable
    }
  };

  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    if (createdWorldId) {
      navigate(`/worlds/${createdWorldId}`);
    }
    setCreatedWorldId(null);
  };

  return (
    <>
      {variant === "button" ? (
        <Button variant="sf-primary" size="sf-md" className={`gap-2 ${className ?? ""}`} onClick={handleClick}>
          <Plus className="w-4 h-4" aria-hidden="true" />
          Begin survey
        </Button>
      ) : (
      <button type="button" onClick={handleClick} className={`w-full text-left ${className ?? ""}`}>
        <GlassPanel
          hover
          className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center gap-3 border-dashed border-2 border-sf-stellar hover:border-sf-stellar group"
        >
          <div className="w-14 h-14 rounded-none bg-sf-stellar/[0.06] border border-sf-stellar flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-7 h-7 text-sf-stellar-text" />
          </div>
          <div className="text-center">
            <h3 className="font-heading font-medium text-lg">INITIALIZE NEW WORLD</h3>
            <p className="text-sm text-t2 mt-1">
              Begin survey.
            </p>
          </div>
        </GlassPanel>
      </button>
      )}

      {/* Auth Dialog for unauthenticated users */}
      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />

      {/* BEGIN SURVEY: designation, star, world, life. Keeps the old
          one-step create as INITIALIZE EMPTY on its first screen. */}
      <BeginSurveyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onInitializeEmpty={handleCreate}
        initializingEmpty={createWorld.isPending}
      />

      {/* First world sovereignty welcome */}
      <Dialog open={showWelcome} onOpenChange={(open) => { if (!open) handleWelcomeDismiss(); }}>
        <DialogContent className="sm:max-w-sm">
          <div className="py-6 text-center space-y-4">
            <h2 className="font-heading text-lg tracking-wide uppercase">
              World Initialized.
            </h2>
            <div className="space-y-2">
              <p className="text-sm text-t2 leading-relaxed">
                Everything you create here is yours.
              </p>
              <p className="text-sm text-t2 leading-relaxed">
                Encrypted, versioned, exportable. Always.
              </p>
            </div>
            <Button className="gap-2 mt-2" onClick={handleWelcomeDismiss}>
              Begin Survey
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateWorldButton;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Loader } from "@/components/ui/loader";
import { BackLink } from "@/components/ui/back-link";
import { Notice, PageHeader } from "@/components/layout/page-chrome";
import CubeLogo from "@/components/icons/CubeLogo";
import { PageBursts } from "@/components/ui/data-burst";
import { AUTH_BURSTS } from "@/lib/data-bursts";
import { useToast } from "@/hooks/use-toast";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { mapError, VOICE } from "@/lib/ship-voice";
import { PASSWORD_MIN_LENGTH, passwordSchema } from "@/lib/auth-validation";

type Phase = "checking" | "ready" | "invalid";

/** How long to wait for the recovery link to produce a session. */
const RECOVERY_WAIT_MS = 5000;

/**
 * /auth/reset — landing page for the password-recovery email link.
 *
 * supabase-js parses the recovery token from the URL on load and emits
 * PASSWORD_RECOVERY with a short-lived session. This page is lazy-loaded, so
 * the event may have fired before we subscribe; we also accept an existing
 * session. No session within RECOVERY_WAIT_MS, or an error in the URL,
 * means the link is expired or already used.
 */
const ResetPassword = () => {
  useMetaTags({ title: "Reset Password" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Expired / reused links come back with an error in the hash or query.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    if (hash.get("error") || hash.get("error_code") || query.get("error") || query.get("error_code")) {
      setPhase("invalid");
      return;
    }

    let settled = false;
    const settle = (next: Phase) => {
      if (settled) return;
      settled = true;
      setPhase(next);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) settle("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) settle("ready");
    });

    const timer = window.setTimeout(() => settle("invalid"), RECOVERY_WAIT_MS);
    return () => {
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { password?: string; confirm?: string } = {};
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) next.password = parsed.error.errors[0].message;
    if (confirm !== password) next.confirm = "PASSWORDS DO NOT MATCH.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSaving(false);
    if (error) {
      toast({ title: "PASSWORD UPDATE FAILED.", description: mapError(error), variant: "destructive" });
      return;
    }
    toast({ title: VOICE.passwordUpdated });
    navigate("/", { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <PageBursts bursts={AUTH_BURSTS} />
      <div className="flex-1 flex items-center justify-center p-4">
        <GlassPanel className="w-full max-w-md p-8" glow>
          <PageHeader
            size="card"
            align="center"
            icon={<CubeLogo size={48} className="rounded-none" />}
            eyebrow="ACCOUNT RECOVERY"
            title="Set new password"
          />

          {phase === "checking" && (
            <div className="flex flex-col items-center gap-3 py-6" role="status">
              <Loader size="sm" />
              <p className="font-mono text-sf-mono uppercase text-t3">VERIFYING RESET LINK...</p>
            </div>
          )}

          {phase === "invalid" && (
            <div className="space-y-4">
              <Notice tone="danger" label={VOICE.resetLinkInvalid}>
                Reset links work once and expire after one hour. Request a fresh one from the sign-in panel.
              </Notice>
              <Button className="w-full" size="lg" onClick={() => navigate("/auth?tab=reset")}>
                REQUEST NEW LINK
              </Button>
              <div className="flex justify-center">
                <BackLink to="/auth?tab=login" label="Back to sign in" />
              </div>
            </div>
          )}

          {phase === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="text-sm text-t2">
                Choose a new password of at least {PASSWORD_MIN_LENGTH} characters.
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="sf-input-bracketed">
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSaving}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "new-password-error" : undefined}
                  />
                </div>
                {errors.password && (
                  <p id="new-password-error" className="text-sm text-sf-crimson-text">// {errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="sf-input-bracketed">
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={isSaving}
                    aria-invalid={!!errors.confirm}
                    aria-describedby={errors.confirm ? "confirm-password-error" : undefined}
                  />
                </div>
                {errors.confirm && (
                  <p id="confirm-password-error" className="text-sm text-sf-crimson-text">// {errors.confirm}</p>
                )}
              </div>
              <Button type="submit" className="w-full gap-2" size="lg" disabled={isSaving}>
                {isSaving ? <Loader variant="inline" size="sm" /> : <KeyRound className="w-4 h-4" />}
                UPDATE PASSWORD
              </Button>
            </form>
          )}
        </GlassPanel>
      </div>
    </div>
  );
};

export default ResetPassword;

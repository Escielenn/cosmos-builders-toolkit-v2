import { GoogleMark } from "@/components/ui/google-mark";
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import CubeLogo from "@/components/icons/CubeLogo";
import { Wordmark } from "@/components/brand/Wordmark";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { TERMS_CONTENT } from "@/lib/legal/terms-content";
import { PageBursts } from "@/components/ui/data-burst";
import { AUTH_BURSTS } from "@/lib/data-bursts";
import { mapError } from "@/lib/ship-voice";
import { BackLink } from "@/components/ui/back-link";
import { Notice, PageHeader } from "@/components/layout/page-chrome";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { emailSchema, passwordSchema } from "@/lib/auth-validation";

// Invite codes that grant access to the sign-up form.
// Add new codes here as needed. The URL is /join/<code>
const VALID_CODES = new Set([
  "stellarforge-early-access",
  "vanguard-2026",
  "alpha",
]);

const Join = () => {
  useMetaTags({ title: "Join" });
  const { code } = useParams<{ code: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [tosAccepted, setTosAccepted] = useState(false);
  const [tosDialogOpen, setTosDialogOpen] = useState(false);

  const { signUp, signInWithOAuth, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate the join code
  const isValidCode = !!(code && VALID_CODES.has(code));

  // noindex for /join/* comes from the route policy (src/lib/seo/routes.ts).

  // Don't auto-redirect, show the page even if logged in
  // (user may be testing the link or sharing the screen)

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const { error } = await signUp(email, password, displayName);
    setIsLoading(false);
    if (error) {
      toast({
        title: "SIGN UP FAILED.",
        description: mapError(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "PERSONNEL FILE CREATED.",
        description: "All instruments on standby.",
      });
      navigate("/");
    }
  };

  const handleOAuthSignUp = async (provider: 'google' | 'github' | 'discord' | 'apple' | 'notion') => {
    setIsLoading(true);
    const { error } = await signInWithOAuth(provider);
    setIsLoading(false);
    if (error) {
      toast({
        title: `${provider.toUpperCase()} SIGN UP FAILED.`,
        description: mapError(error),
        variant: "destructive",
      });
    }
  };

  // Already logged in (skip loading check, render form immediately)
  if (user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <PageHeader
            size="card"
            align="center"
            icon={<CubeLogo size={48} className="rounded-none" />}
            eyebrow="EARLY ACCESS"
            title="You're already signed in"
            lede="You already have a StellarForge account. Head to your dashboard to start building."
          />
          <Link to="/" className="inline-flex min-h-hit items-center text-sm text-sf-primary-text hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Invalid or missing code, show nothing useful
  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <PageHeader
            size="card"
            align="center"
            accent="crimson"
            icon={<CubeLogo size={48} className="rounded-none" />}
            eyebrow="EARLY ACCESS"
            title="Link expired or invalid"
            lede="This invitation link is no longer valid. If you believe this is an error, contact the person who shared it with you."
          />
          <BackLink to="/auth" label="Back to sign in" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <header className="border-b border-sf-line-hairline backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Wordmark size="md" to="/" />
        </div>
      </header>
      <PageBursts bursts={AUTH_BURSTS} />

      <div className="flex-1 flex items-center justify-center p-4">
        <GlassPanel className="w-full max-w-md p-8">
          <PageHeader
            size="card"
            align="center"
            eyebrow="EARLY ACCESS"
            title="Establish credentials"
            lede="You've been invited to join the early access program."
          />

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 mb-3"
            size="lg"
            onClick={() => handleOAuthSignUp('google')}
            disabled={isLoading}
          >
            <GoogleMark />
            CREATE ACCOUNT VIA GOOGLE
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sf-line-hairline"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-sf-surface px-2 text-t4">or create with email</span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Display Name <span className="text-t4 normal-case tracking-normal">(optional)</span></Label>
              <div className="sf-input-bracketed">
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="sf-input-bracketed">
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-sm text-sf-crimson-text">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="sf-input-bracketed">
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.password && <p className="text-sm text-sf-crimson-text">{errors.password}</p>}
            </div>

            {/* TOS Checkbox */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="tos-accept"
                checked={tosAccepted}
                onCheckedChange={(checked) => setTosAccepted(checked === true)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <label htmlFor="tos-accept" className="text-xs text-t3 leading-relaxed cursor-pointer">
                I have read and agree to the{" "}
                <button
                  type="button"
                  className="text-sf-primary-text hover:underline"
                  onClick={(e) => { e.preventDefault(); setTosDialogOpen(true); }}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <Link to="/privacy" className="text-sf-primary-text hover:underline" target="_blank">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading || !tosAccepted}>
              {isLoading ? (
                <Loader variant="inline" size="sm" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              CREATE ACCOUNT
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            {/* NDA / Confidentiality notice */}
            <Notice tone="caution" label="Early Access - Confidential Preview">
              <p className="mb-2">
                StellarForge is in active development. By creating an account, you agree to the following early access terms:
              </p>
              <ul className="space-y-1.5 list-none">
                <li className="flex gap-2">
                  <span className="text-sf-amber-text shrink-0" aria-hidden>-</span>
                  <span><strong className="text-t2">Confidentiality.</strong> This is a private preview. No screenshots, recordings, reviews, social media posts, or public discussion of the product, its features, or its interface.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sf-amber-text shrink-0" aria-hidden>-</span>
                  <span><strong className="text-t2">Early access pricing.</strong> Current pricing reflects the early access period and is lower than launch pricing. Your rate is locked for as long as your subscription remains active.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sf-amber-text shrink-0" aria-hidden>-</span>
                  <span><strong className="text-t2">Work in progress.</strong> Features may change, and you may encounter bugs. We have a fully working bug reporting system - your feedback directly shapes the product.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sf-amber-text shrink-0" aria-hidden>-</span>
                  <span><strong className="text-t2">Support & Roadmap.</strong> We are available for direct support, and our full development roadmap is visible at <a href="/roadmap" className="text-sf-primary-text hover:underline">stellarforge.tools/roadmap</a>.</span>
                </li>
              </ul>
            </Notice>

            {/* Privacy notice */}
            <Notice tone="info" label="Your Worlds Are Yours Alone">
              All creative content is encrypted, user-isolated, and never accessed by StellarForge systems. No AI training. No data mining. No third-party sharing.
            </Notice>
          </div>
        </GlassPanel>
      </div>

      {/* TOS Dialog */}
      <Dialog open={tosDialogOpen} onOpenChange={setTosDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto sf-sb">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-heading [&_h2]:font-light [&_h2]:tracking-wider [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:font-medium [&_h4]:mt-3 [&_h4]:mb-1 [&_p]:text-sm [&_p]:text-t3 [&_p]:leading-relaxed [&_p]:mb-3 [&_li]:text-sm [&_li]:text-t3 [&_hr]:border-sf-line-hairline [&_hr]:my-4 [&_strong]:text-t1">
            <ReactMarkdown>{TERMS_CONTENT}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Join;
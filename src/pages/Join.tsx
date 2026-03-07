import { useState, useEffect } from "react";
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
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import { TERMS_CONTENT } from "@/lib/legal/terms-content";
import { PageBursts } from "@/components/ui/data-burst";
import { AUTH_BURSTS } from "@/lib/data-bursts";

const emailSchema = z.string().email("Valid email required.");
const passwordSchema = z.string().min(6, "Minimum 6 characters.");

const JOIN_SECRET = import.meta.env.VITE_JOIN_SECRET || "";

const Join = () => {
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
  const isValidCode = JOIN_SECRET && code === JOIN_SECRET;

  // Prevent crawling of this page
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

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
        title: "Sign up failed",
        description: error.message === "User already registered"
          ? "Account already exists. Sign in instead."
          : error.message,
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
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign up failed`,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Invalid or missing code — show nothing useful
  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <CubeLogo size={48} className="rounded-lg mb-6" />
        <h1 className="font-display text-xl font-light tracking-[0.1em] mb-3">
          LINK EXPIRED OR INVALID
        </h1>
        <p className="text-sm text-tier-3 mb-6 text-center max-w-sm">
          This invitation link is no longer valid. If you believe this is an error,
          contact the person who shared it with you.
        </p>
        <Link to="/auth" className="text-sm text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/auth" className="flex items-center gap-3 group">
            <CubeLogo size={40} className="rounded-lg" />
            <div className="flex flex-col">
              <span className="font-display font-light text-lg leading-tight tracking-sf-wide">
                STELLARFORGE
              </span>
              <span className="text-xs text-muted-foreground">Science Fiction Worldbuilding Tools</span>
            </div>
          </Link>
        </div>
      </header>
      <PageBursts bursts={AUTH_BURSTS} />

      <div className="flex-1 flex items-center justify-center p-4">
        <GlassPanel className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-light tracking-[0.12em] mb-2">
              ESTABLISH CREDENTIALS
            </h1>
            <p className="text-sm text-tier-3">
              You've been invited to join the early access program.
            </p>
          </div>

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 mb-3"
            size="lg"
            onClick={() => handleOAuthSignUp('google')}
            disabled={isLoading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            CREATE ACCOUNT VIA GOOGLE
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-tier-4">or create with email</span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Display Name <span className="text-tier-4 normal-case tracking-normal">(optional)</span></Label>
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
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
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
              <label htmlFor="tos-accept" className="text-xs text-tier-3 leading-relaxed cursor-pointer">
                I have read and agree to the{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={(e) => { e.preventDefault(); setTosDialogOpen(true); }}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline" target="_blank">
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

          <div className="mt-6">
            <div className="p-3 rounded-sm bg-primary/5 border border-primary/20">
              <p className="text-xs font-medium text-foreground mb-1">
                Your Worlds Are Yours Alone
              </p>
              <p className="text-[11px] text-tier-3 leading-relaxed">
                All creative content is encrypted, user-isolated, and never accessed by StellarForge systems. No AI training. No data mining. No third-party sharing.
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* TOS Dialog */}
      <Dialog open={tosDialogOpen} onOpenChange={setTosDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-heading [&_h2]:font-light [&_h2]:tracking-[0.08em] [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3 [&_li]:text-sm [&_li]:text-muted-foreground [&_hr]:border-border/30 [&_hr]:my-4 [&_strong]:text-foreground">
            <ReactMarkdown>{TERMS_CONTENT}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Join;
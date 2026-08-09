import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { LogIn, Rocket, ChevronDown, Layers, Share2, FileDown } from "lucide-react";
import CubeLogo from "@/components/icons/CubeLogo";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { PageBursts } from "@/components/ui/data-burst";
import { AUTH_BURSTS } from "@/lib/data-bursts";

const YOUTUBE_VIDEO_ID = "iGYxmAQa8DY";

const emailSchema = z.string().email("VALID EMAIL REQUIRED.");
const passwordSchema = z.string().min(6, "AT LEAST 6 CHARS REQUIRED.");

const Auth = () => {
  // Login state (existing-user sign-in)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showLogin, setShowLogin] = useState(false);

  // Signup state (new-account creation)
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupDisplayName, setSignupDisplayName] = useState("");
  const [signupErrors, setSignupErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  const { signIn, signUp, signInWithOAuth, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Scroll to anchor target when arriving via a hash link (e.g., the
  // logo-adjacent "Sign Up / Log In" button links to /auth#create-account).
  // ScrollToTop runs first on route change, so we wait one frame for layout.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateLogin = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast({
        title: "AUTHENTICATION FAILED.",
        description: error.message === "Invalid login credentials"
          ? "CREDENTIALS NOT RECOGNIZED. VERIFY AND RETRY."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "SESSION ESTABLISHED." });
      navigate("/");
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'discord' | 'apple' | 'notion') => {
    setIsLoading(true);
    const { error } = await signInWithOAuth(provider);
    setIsLoading(false);
    if (error) {
      toast({
        title: `${provider.toUpperCase()} AUTHENTICATION FAILED.`,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const validateSignup = () => {
    const newErrors: { email?: string; password?: string; displayName?: string } = {};
    const emailResult = emailSchema.safeParse(signupEmail);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(signupPassword);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    setSignupErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setIsSigningUp(true);
    const { error } = await signUp(
      signupEmail,
      signupPassword,
      signupDisplayName.trim() || undefined,
    );
    setIsSigningUp(false);
    if (error) {
      toast({
        title: "SIGNUP FAILED.",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSignupComplete(true);
      toast({
        title: "ACCOUNT CREATED.",
        description: "Check your email to confirm; you can sign in once verified.",
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

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <PageBursts bursts={AUTH_BURSTS} />

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 max-w-4xl py-12 md:py-20 space-y-12">

          {/* Hero, display-font scale per April 2026 handoff */}
          <div className="space-y-7">
            <CubeLogo size={80} className="rounded-none" />
            <div className="inline-flex items-center gap-3.5 font-mono uppercase text-sf-teal text-[13px] tracking-[3px]">
              <span aria-hidden className="block w-12 h-px bg-sf-teal" />
              <span>// OPEN EARLY ACCESS</span>
            </div>
            <h1 className="font-display font-light text-sf-hero leading-[0.98] text-t1 max-w-[12ch]">
              <span className="text-sf-teal">Stellar</span>forge.
            </h1>
            <p className="font-heading text-[12px] tracking-[0.2em] uppercase text-t3">
              Science Fiction Worldbuilding Tools
            </p>
            <p className="font-sans text-[19px] text-t2 max-w-[780px] leading-[1.55]">
              Design planets, species, civilizations, and spacecraft with scientific rigor.
              Every parameter cascades logically: environment shapes biology, biology shapes
              psychology, psychology shapes mythology, mythology shapes culture.
              Build worlds that hold together.
            </p>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6">
            <GlassPanel className="p-6 text-center md:text-left">
              <div className="w-10 h-10 rounded-none bg-sf-teal/[0.06] border border-sf-teal/[0.15] flex items-center justify-center mb-3 mx-auto md:mx-0">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-[12px] font-medium uppercase tracking-[0.2em] text-sf-teal mb-2">
                Systematic Worldbuilding
              </h3>
              <p className="text-sm text-t3">
                20+ interconnected tools. Environment shapes biology, biology shapes
                psychology, psychology shapes mythology, mythology shapes culture.
              </p>
            </GlassPanel>
            <GlassPanel className="p-6 text-center md:text-left">
              <div className="w-10 h-10 rounded-none bg-sf-stellar/[0.06] border border-sf-stellar/[0.15] flex items-center justify-center mb-3 mx-auto md:mx-0">
                <Share2 className="w-5 h-5 text-sf-stellar" />
              </div>
              <h3 className="font-heading text-[12px] font-medium uppercase tracking-[0.2em] text-sf-teal mb-2">
                Cross-Tool Integration
              </h3>
              <p className="text-sm text-t3">
                Data flows between tools. Your spacecraft references your planet's
                atmosphere automatically.
              </p>
            </GlassPanel>
            <GlassPanel className="p-6 text-center md:text-left">
              <div className="w-10 h-10 rounded-none bg-sf-teal/[0.06] border border-sf-teal/[0.15] flex items-center justify-center mb-3 mx-auto md:mx-0">
                <FileDown className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-[12px] font-medium uppercase tracking-[0.2em] text-sf-teal mb-2">
                Export Everything
              </h3>
              <p className="text-sm text-t3">
                PDF reports, DOCX documents, shared links, and full World Bible exports.
                Your data is always yours.
              </p>
            </GlassPanel>
          </div>

          {/* Video */}
          <GlassPanel className="overflow-hidden p-2" lightArc glow>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-sm"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
                title="StellarForge Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </GlassPanel>

          {/* Create Account, OAuth + email/password signup. The id is the
              scroll target for /auth#create-account links from elsewhere
              (e.g., the logo-adjacent Sign Up / Log In button in Header). */}
          <GlassPanel id="create-account" className="p-8 max-w-lg mx-auto scroll-mt-24" glow>
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl font-light tracking-[0.1em] mb-2">
                CREATE ACCOUNT
              </h2>
              <p className="text-sm text-t3">
                Open early access. Still under construction. Your feedback shapes what we ship.
              </p>
            </div>

            {signupComplete ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-sm bg-primary/[0.06] border border-primary/[0.15] flex items-center justify-center mx-auto">
                  <Rocket className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-sm font-light tracking-[0.1em] uppercase">
                  ACCOUNT CREATED
                </h3>
                <p className="text-sm text-t3">
                  Check your email to confirm. You can sign in once verified.
                </p>
              </div>
            ) : (
              <>
                {/* OAuth, primary, fast path */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 mb-3"
                  size="lg"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading || isSigningUp}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  CONTINUE WITH GOOGLE
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-sf-border"></div>
                  </div>
                  <div className="relative flex justify-center font-mono text-[12px] tracking-[0.18em] uppercase">
                    <span className="bg-sf-surface px-2 text-t4">// OR EMAIL</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-display-name">
                      Display name <span className="text-t4 normal-case tracking-normal">(optional)</span>
                    </Label>
                    <div className="sf-input-bracketed">
                      <Input
                        id="signup-display-name"
                        type="text"
                        placeholder="Your name"
                        value={signupDisplayName}
                        onChange={(e) => setSignupDisplayName(e.target.value)}
                        disabled={isSigningUp}
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
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        disabled={isSigningUp}
                      />
                    </div>
                    {signupErrors.email && <p className="text-sm text-sf-crimson">{signupErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="sf-input-bracketed">
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={isSigningUp}
                      />
                    </div>
                    {signupErrors.password && <p className="text-sm text-sf-crimson">{signupErrors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full gap-2" size="lg" disabled={isSigningUp}>
                    {isSigningUp ? (
                      <Loader variant="inline" size="sm" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    CREATE ACCOUNT
                  </Button>
                </form>
              </>
            )}
          </GlassPanel>

          {/* Existing User Login, Collapsible */}
          <div className="max-w-lg mx-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowLogin(!showLogin)}
              className="w-full gap-2"
            >
              <LogIn className="w-4 h-4" />
              Already have an account? Sign in
              <ChevronDown className={`w-4 h-4 transition-transform ${showLogin ? "rotate-180" : ""}`} />
            </Button>

            {showLogin && (
              <GlassPanel className="p-6 mt-2">
                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 mb-3"
                  size="lg"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  AUTHENTICATE VIA GOOGLE
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-sf-border"></div>
                  </div>
                  <div className="relative flex justify-center font-mono text-[12px] tracking-[0.18em] uppercase">
                    <span className="bg-sf-surface px-2 text-t4">// OR EMAIL</span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="sf-input-bracketed">
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-sf-crimson">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="sf-input-bracketed">
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-sf-crimson">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <Loader variant="inline" size="sm" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    AUTHENTICATE
                  </Button>
                </form>
              </GlassPanel>
            )}
          </div>

          {/* Footer */}
          <div className="text-center font-mono text-[12px] tracking-[0.18em] text-t5 pb-8 uppercase">
            <p>© {new Date().getFullYear()} STELLARFORGE · 39.87°N · 104.97°W</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
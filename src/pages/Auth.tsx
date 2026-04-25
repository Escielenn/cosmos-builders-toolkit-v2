import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { LogIn, Send, ChevronDown, Layers, Share2, FileDown } from "lucide-react";
import CubeLogo from "@/components/icons/CubeLogo";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useContact } from "@/hooks/use-contact";
import { z } from "zod";
import { earlyAccessSchema } from "@/lib/contact-schemas";
import { PageBursts } from "@/components/ui/data-burst";
import { AUTH_BURSTS } from "@/lib/data-bursts";

const YOUTUBE_VIDEO_ID = "iGYxmAQa8DY";

const emailSchema = z.string().email("VALID EMAIL REQUIRED.");
const passwordSchema = z.string().min(6, "AT LEAST 6 CHARS REQUIRED.");

const Auth = () => {
  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showLogin, setShowLogin] = useState(false);

  // Early access state
  const [eaName, setEaName] = useState("");
  const [eaEmail, setEaEmail] = useState("");
  const [eaWriting, setEaWriting] = useState("");
  const [eaHeard, setEaHeard] = useState("");
  const [eaHoneypot, setEaHoneypot] = useState("");
  const [eaErrors, setEaErrors] = useState<Record<string, string>>({});
  const [eaSubmitted, setEaSubmitted] = useState(false);

  const { signIn, signInWithOAuth, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submitEarlyAccess } = useContact();

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

  const handleEarlyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = earlyAccessSchema.safeParse({
      name: eaName,
      email: eaEmail,
      writingFocus: eaWriting,
      heardFrom: eaHeard || undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setEaErrors(fieldErrors);
      return;
    }
    setEaErrors({});
    submitEarlyAccess.mutate(
      { ...parsed.data, honeypot: eaHoneypot },
      {
        onSuccess: () => setEaSubmitted(true),
        onError: () => {
          toast({
            title: "TRANSMISSION FAILED.",
            description: "RETRY WHEN READY.",
            variant: "destructive",
          });
        },
      }
    );
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

          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CubeLogo size={80} className="rounded-none" />
            </div>
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] text-sf-teal uppercase mb-3">
                // CLEARANCE REQUIRED
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-light tracking-[0.08em] mb-3 text-t1 uppercase">
                STELLARFORGE
              </h1>
              <p className="text-t3 text-sm tracking-[0.2em] uppercase font-heading">
                Science Fiction Worldbuilding Tools
              </p>
            </div>
            <p className="text-t2 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Design planets, species, civilizations, and spacecraft with scientific rigor.
              Every parameter cascades logically—environment shapes biology, biology shapes
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
              <h3 className="font-heading text-[11px] font-medium uppercase tracking-[0.2em] text-sf-teal mb-2">
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
              <h3 className="font-heading text-[11px] font-medium uppercase tracking-[0.2em] text-sf-teal mb-2">
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
              <h3 className="font-heading text-[11px] font-medium uppercase tracking-[0.2em] text-sf-teal mb-2">
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

          {/* Early Access Request */}
          <GlassPanel className="p-8 max-w-lg mx-auto" glow>
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl font-light tracking-[0.1em] mb-2">
                REQUEST EARLY ACCESS
              </h2>
              <p className="text-sm text-t3">
                StellarForge is in closed beta. Request access and we'll be in touch.
              </p>
            </div>

            {eaSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-sm bg-primary/[0.06] border border-primary/[0.15] flex items-center justify-center mx-auto">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-sm font-light tracking-[0.1em] uppercase">
                  TRANSMISSION RECEIVED
                </h3>
                <p className="text-sm text-t3">
                  We'll review your request and reach out when a spot opens up.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEarlyAccess} className="space-y-4">
                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="website_url"
                    tabIndex={-1}
                    autoComplete="off"
                    value={eaHoneypot}
                    onChange={(e) => setEaHoneypot(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ea-name">Name</Label>
                  <div className="sf-input-bracketed">
                    <Input
                      id="ea-name"
                      type="text"
                      placeholder="Your name"
                      value={eaName}
                      onChange={(e) => setEaName(e.target.value)}
                      disabled={submitEarlyAccess.isPending}
                    />
                  </div>
                  {eaErrors.name && <p className="text-sm text-sf-crimson">{eaErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ea-email">Email</Label>
                  <div className="sf-input-bracketed">
                    <Input
                      id="ea-email"
                      type="email"
                      placeholder="you@example.com"
                      value={eaEmail}
                      onChange={(e) => setEaEmail(e.target.value)}
                      disabled={submitEarlyAccess.isPending}
                    />
                  </div>
                  {eaErrors.email && <p className="text-sm text-sf-crimson">{eaErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ea-writing">What kind of sci-fi do you write or worldbuild?</Label>
                  <div className="sf-input-bracketed">
                    <textarea
                      id="ea-writing"
                      className="flex min-h-[80px] w-full rounded-none border border-sf-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-t4 focus-visible:outline-none focus-visible:border-sf-teal/[0.35] disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors duration-base"
                      placeholder="Hard sci-fi novels, TTRPG campaigns, screenwriting..."
                      value={eaWriting}
                      onChange={(e) => setEaWriting(e.target.value)}
                      disabled={submitEarlyAccess.isPending}
                    />
                  </div>
                  {eaErrors.writingFocus && <p className="text-sm text-sf-crimson">{eaErrors.writingFocus}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ea-heard">How did you hear about StellarForge? <span className="text-t4 normal-case tracking-normal">(optional)</span></Label>
                  <div className="sf-input-bracketed">
                    <Input
                      id="ea-heard"
                      type="text"
                      placeholder="Twitter, Reddit, a friend..."
                      value={eaHeard}
                      onChange={(e) => setEaHeard(e.target.value)}
                      disabled={submitEarlyAccess.isPending}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={submitEarlyAccess.isPending}
                >
                  {submitEarlyAccess.isPending ? (
                    <Loader variant="inline" size="sm" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  REQUEST ACCESS
                </Button>
              </form>
            )}
          </GlassPanel>

          {/* Existing User Login — Collapsible */}
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
                  <div className="relative flex justify-center font-mono text-[11px] tracking-[0.18em] uppercase">
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
          <div className="text-center font-mono text-[11px] tracking-[0.18em] text-t5 pb-8 uppercase">
            <p>© {new Date().getFullYear()} STELLARFORGE · 39.87°N · 104.97°W</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
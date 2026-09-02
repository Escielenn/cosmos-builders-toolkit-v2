import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  Check,
  Download,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

// ---------------------------------------------------------------------------
// Variant types & content
// ---------------------------------------------------------------------------

export type WelcomeVariant = "signup" | "pro" | "vanguard";

interface VariantConfig {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  features?: string[];
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href?: string; scrollTo?: string };
  accentColor: "teal" | "violet";
  showPwaPrompt: boolean;
  upsell?: string;
}

const VARIANTS: Record<WelcomeVariant, VariantConfig> = {
  signup: {
    icon: Sparkles,
    title: "WELCOME TO STELLARFORGE",
    subtitle: "These worlds exist in you. Waiting to be found.",
    accentColor: "teal",
    showPwaPrompt: true,
    primaryAction: { label: "Getting Started", href: "/getting-started" },
    secondaryAction: { label: "Create Your First World", href: "/worlds" },
  },
  pro: {
    icon: Zap,
    title: "PRO ACCESS ACTIVATED",
    subtitle: "All instruments unlocked.",
    features: [
      "Unlimited worlds",
      "Full export suite (PDF, DOCX, Notion)",
      "Cloud sync across devices",
      "All future tools included",
    ],
    accentColor: "teal",
    showPwaPrompt: false,
    primaryAction: { label: "Create a World", href: "/worlds" },
    secondaryAction: { label: "Explore Tools", scrollTo: "tools" },
    upsell: "Unlock voting & early access with Vanguard",
  },
  vanguard: {
    icon: Sparkles,
    title: "VANGUARD ACCESS ACTIVATED",
    subtitle: "You're shaping what comes next.",
    features: [
      "10 roadmap votes every month",
      "Early access to new tools",
      "Course discounts up to 25%",
    ],
    accentColor: "violet",
    showPwaPrompt: false,
    primaryAction: { label: "Visit Roadmap", href: "/roadmap" },
    secondaryAction: { label: "Explore Tools", scrollTo: "tools" },
  },
};

// ---------------------------------------------------------------------------
// Accent styling helpers
// ---------------------------------------------------------------------------

const ACCENT = {
  teal: {
    gradient: "from-transparent via-primary/60 to-transparent",
    icon: "text-primary",
    check: "text-sf-emerald",
    upsell: "text-primary/60 hover:text-primary",
  },
  violet: {
    gradient: "from-transparent via-violet-500/60 to-transparent",
    icon: "text-sf-violet",
    check: "text-sf-violet",
    upsell: "",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: WelcomeVariant;
}

export default function WelcomeDialog({ open, onOpenChange, variant }: WelcomeDialogProps) {
  const navigate = useNavigate();
  const config = VARIANTS[variant];
  const accent = ACCENT[config.accentColor];
  const { canPrompt, isStandalone, promptInstall, manualInstructions } = usePwaInstall();

  const Icon = config.icon;

  const handleAction = (action: { href?: string; scrollTo?: string }) => {
    onOpenChange(false);
    if (action.href) {
      navigate(action.href);
    } else if (action.scrollTo) {
      // Navigate home first if not there, then scroll
      const scroll = () => {
        const el = document.getElementById(action.scrollTo!);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      };
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(scroll, 150);
      } else {
        scroll();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-[2px] bg-gradient-to-r ${accent.gradient}`} />

        <div className="px-6 pt-8 pb-6 text-center space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`w-12 h-12 flex items-center justify-center ${accent.icon}`}>
              <Icon className="w-8 h-8" strokeWidth={1.5} />
            </div>
          </div>

          {/* Title & subtitle */}
          <div className="space-y-2">
            <h2 className="font-display text-2xl tracking-sf-title text-t1 uppercase">
              {config.title}
            </h2>
            <p className="text-sm text-t2 leading-relaxed">
              {config.subtitle}
            </p>
          </div>

          {/* Feature list */}
          {config.features && config.features.length > 0 && (
            <div className="text-left space-y-2 py-2">
              {config.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2.5">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${accent.check}`} />
                  <span className="text-sm text-t2">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* PWA install section (signup only) */}
          {config.showPwaPrompt && !isStandalone && (
            <div className="border-t border-sf-line pt-4 space-y-2">
              <p className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
                Quick Access
              </p>
              {canPrompt ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={promptInstall}
                >
                  <Download className="w-3.5 h-3.5" />
                  Install StellarForge
                </Button>
              ) : (
                <p className="text-xs text-t4 flex items-center justify-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" />
                  {manualInstructions}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => handleAction(config.primaryAction)}
            >
              {config.primaryAction.label}
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleAction(config.secondaryAction)}
            >
              {config.secondaryAction.label}
            </Button>
          </div>

          {/* Vanguard upsell (Pro variant only) */}
          {config.upsell && (
            <button
              type="button"
              className={`text-xs ${accent.upsell} transition-colors`}
              onClick={() => {
                onOpenChange(false);
                navigate("/pricing");
              }}
            >
              {config.upsell} &rarr;
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// GraphOnboarding, First-time onboarding tooltips for the World Graph.
// Shows once per user (persisted in localStorage).
// ---------------------------------------------------------------------------

import { useState, useCallback, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sf-graph-onboarding-seen";

interface OnboardingStep {
  title: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: "Create Entities",
    description:
      "Click '+ Entity' to add elements to your world: planets, species, factions, characters, and more.",
  },
  {
    title: "Connect Them",
    description:
      "Drag from a node's handle to another node to create cascade-aware connections with type, strength, and direction.",
  },
  {
    title: "Filter by Cascade",
    description:
      "Use the cascade bar to solo or toggle stages. Click a stage to focus, Shift+click to multi-select.",
  },
  {
    title: "Analyze Your World",
    description:
      "Use Gravity, Tensions, Paths, Clusters, and What-If tools to discover structure, contradictions, and story opportunities.",
  },
  {
    title: "Cascade Audit",
    description:
      "Right-click any entity to trace its full cascade chain: see how a single physics change ripples through culture.",
  },
];

export function GraphOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) {
      handleDismiss();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, handleDismiss]);

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 w-[320px]"
      style={{
        background: "rgba(15,15,16,0.98)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(61,255,205,0.15)",
        padding: "16px",
      }}
      data-export-ignore
    >
      {/* Close */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-t4 hover:text-t2"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Step indicator */}
      <div className="flex gap-1 mb-3">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 transition-colors"
            style={{
              background: i <= step ? "#15C17B" : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <h4 className="font-heading text-[11px] uppercase tracking-[2px] text-teal mb-1.5">
        {current.title}
      </h4>
      <p className="text-[11px] font-sans text-t2 leading-relaxed mb-3">
        {current.description}
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-t5">
          {step + 1} / {STEPS.length}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-6 text-[10px] font-sans text-t4"
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            className="h-6 text-[10px] font-sans"
          >
            {step >= STEPS.length - 1 ? "Got it" : "Next"}
            {step < STEPS.length - 1 && <ChevronRight className="w-3 h-3 ml-0.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * CascadeSuggestionToast, Shown after worksheet save when the next
 * cascade layer has no data yet.
 *
 * Dismissable, with a shelf life (persists dismiss for 7 days per tool).
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2, Issue 5
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { getToolRoute } from "@/lib/tools-config";
import { Button } from "@/components/ui/button";
import { getDownstreamSuggestions } from "@/lib/cascade-guidance";
import { manifestById, manifestForTool } from "@/canon/manifests";
import { predicateLabel } from "@/canon/vocabulary";

/**
 * 1.9 F-02: the next step comes from the manifests when the tool has one: the
 * first downstream tool that reads something this tool just produced, named
 * by what it reads. Layer guidance is the fallback for unwired tools.
 */
export function manifestSuggestion(toolType: string): { toolType: string; brandName: string; prompt: string } | null {
  const self = manifestForTool(toolType);
  if (!self) return null;
  const produced = new Set(self.produces.map((p) => p.predicate));
  for (const id of self.downstream) {
    const next = manifestById(id);
    if (!next) continue;
    const reads = next.consumes.filter((c) => produced.has(c.predicate)).map((c) => predicateLabel(c.predicate).toLowerCase());
    if (reads.length === 0) continue;
    const brand = next.name.split(":")[0];
    const list = reads.length > 1 ? `${reads.slice(0, -1).join(", ")} and ${reads[reads.length - 1]}` : reads[0];
    return { toolType: next.tool, brandName: brand, prompt: `${brand} reads the ${list} you just saved. Open it to see what follows from them.` };
  }
  return null;
}

const DISMISS_PREFIX = "sf-cascade-dismiss-";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(toolType: string): boolean {
  try {
    const val = localStorage.getItem(DISMISS_PREFIX + toolType);
    if (!val) return false;
    return Date.now() - parseInt(val, 10) < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function dismissSuggestion(toolType: string): void {
  try {
    localStorage.setItem(DISMISS_PREFIX + toolType, String(Date.now()));
  } catch {
    /* storage unavailable (private mode / quota); dismissal is session-only */
  }
}

interface CascadeSuggestionToastProps {
  /** The tool type that was just saved */
  toolType: string;
  /** World ID for navigation */
  worldId: string | undefined;
  /** Whether the suggestion should be visible */
  visible: boolean;
  onDismiss: () => void;
}

export default function CascadeSuggestionToast({
  toolType,
  worldId,
  visible,
  onDismiss,
}: CascadeSuggestionToastProps) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const suggestion = manifestSuggestion(toolType) ?? getDownstreamSuggestions(toolType)[0];

  useEffect(() => {
    if (visible && suggestion && !isDismissed(toolType)) {
      // Delay appearance slightly for save feedback to register first
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
    setShow(false);
  }, [visible, suggestion, toolType]);

  const handleDismiss = useCallback(() => {
    dismissSuggestion(toolType);
    setShow(false);
    onDismiss();
  }, [toolType, onDismiss]);

  const handleNavigate = useCallback(() => {
    if (!suggestion) return;
    const path = worldId
      ? `/worlds/${worldId}/tools/${suggestion.toolType}`
      : getToolRoute(suggestion.toolType) ?? `/tools/${suggestion.toolType}`;
    navigate(path);
    handleDismiss();
  }, [suggestion, worldId, navigate, handleDismiss]);

  if (!show || !suggestion) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-md animate-in slide-in-from-bottom-4 duration-slow">
      <div className="relative bg-sf-surface/95 backdrop-blur-xl border border-sf-primary px-4 py-3 shadow-lg shadow-black/40">
        {/* Light arc glow */}
        <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-sf-primary-bright/25 to-transparent" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-heading text-sf-eyebrow uppercase text-sf-primary-text mb-1">
              Next in the cascade
            </p>
            <p className="text-[13px] text-t2 leading-relaxed">
              {suggestion.prompt}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigate}
              className="min-h-hit text-sf-primary-text hover:text-t1 text-[13px] px-2"
            >
              Open {suggestion.brandName}
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="flex min-h-hit min-w-hit items-center justify-center text-t4 transition-colors hover:text-t2"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { getDownstreamSuggestions, getToolLayer } from "@/lib/cascade-guidance";

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
  } catch {}
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

  const suggestions = getDownstreamSuggestions(toolType);
  const suggestion = suggestions[0]; // Show the primary suggestion

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
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-sf-surface/95 backdrop-blur-xl border border-primary/15 px-4 py-3 max-w-md shadow-lg shadow-black/40">
        {/* Light arc glow */}
        <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[hsl(157_100%_62%/0.25)] to-transparent" />

        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-heading text-[11px] uppercase tracking-[2px] text-primary/60 mb-1">
              Cascade Suggestion
            </p>
            <p className="text-xs text-t2 leading-relaxed">
              {suggestion.prompt}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigate}
              className="text-primary hover:text-primary/80 text-[12px] uppercase tracking-wider h-7 px-2"
            >
              {suggestion.brandName}
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
            <button
              onClick={handleDismiss}
              className="text-t4 hover:text-t2 transition-colors p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Lightbulb, X, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimeline } from "@/lib/timeline/context";
import { detectCompressionGaps } from "@/lib/timeline/utils";
import type { CompressionSuggestion } from "@/lib/timeline/types";

const CompressionSuggestions = () => {
  const { state, dispatch } = useTimeline();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  const suggestions = useMemo(
    () => detectCompressionGaps(state.events, state.compressions),
    [state.events, state.compressions]
  );

  const visible = suggestions.filter((s) => !dismissedIds.has(s.id));

  if (dismissed || visible.length === 0) return null;

  const handleAccept = (suggestion: CompressionSuggestion) => {
    dispatch({
      type: "CREATE_COMPRESSION",
      payload: {
        startYear: suggestion.startYear,
        endYear: suggestion.endYear,
        style: "break",
        displayWidth: 40,
        isExpanded: false,
        label: suggestion.suggestedLabel,
      },
    });
    setDismissedIds((prev) => new Set([...prev, suggestion.id]));
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleDismissAll = () => {
    setDismissed(true);
  };

  const confidenceColor = (c: CompressionSuggestion["confidence"]) => {
    switch (c) {
      case "high":
        return "bg-emerald-500/20 text-sf-emerald border-emerald-500/30";
      case "medium":
        return "bg-amber-500/20 text-sf-amber border-amber-500/30";
      case "low":
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border border-sf-border rounded-lg text-xs">
      <Lightbulb className="w-3.5 h-3.5 text-sf-amber shrink-0" />
      <span className="text-t3 shrink-0">
        {visible.length} gap{visible.length !== 1 ? "s" : ""} detected
      </span>

      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
        {visible.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-1 shrink-0"
          >
            <Badge
              variant="outline"
              className={`text-[10px] py-0 ${confidenceColor(s.confidence)}`}
            >
              {s.suggestedLabel} ({Math.round(s.gapPercentage)}%)
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 text-primary hover:text-primary"
              onClick={() => handleAccept(s)}
              title="Create compression"
              aria-label="Create compression"
            >
              <Shrink className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 text-t3 hover:text-t1"
              onClick={() => handleDismiss(s.id)}
              title="Dismiss"
              aria-label="Dismiss suggestion"
            >
              <X className="w-2.5 h-2.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-[10px] h-5 px-1.5 text-t3 hover:text-t1 shrink-0"
        onClick={handleDismissAll}
      >
        Dismiss all
      </Button>
    </div>
  );
};

export default CompressionSuggestions;

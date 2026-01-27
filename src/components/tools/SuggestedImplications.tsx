import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, ArrowRight, X, Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Implication } from "@/lib/xenomythology-implications";

interface SuggestedImplicationsProps {
  implications: Implication[];
  onApply?: (implication: Implication) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

const SuggestedImplications = ({
  implications,
  onApply,
  onDismiss,
  className = "",
}: SuggestedImplicationsProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleImplications = implications.filter(imp => !dismissedIds.has(imp.id));

  if (visibleImplications.length === 0) {
    return null;
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    onDismiss?.(id);
  };

  return (
    <GlassPanel
      className={`border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/10 ${className}`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-amber-500/5 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-amber-600 dark:text-amber-400">
                  Suggested Implications
                </h3>
                <p className="text-sm text-muted-foreground">
                  {visibleImplications.length} pattern{visibleImplications.length !== 1 ? "s" : ""} detected from your biology + environment
                </p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-sm text-muted-foreground border-b border-amber-500/20 pb-3">
              These "perceived constants" arise from your species' unique biology experiencing their specific environment.
              They suggest how archetypal energy might be channeled in mythology.
            </p>

            {visibleImplications.map((implication) => {
              const isExpanded = expandedIds.has(implication.id);

              return (
                <div
                  key={implication.id}
                  className="relative bg-background/50 rounded-lg border border-amber-500/20 overflow-hidden"
                >
                  {/* Dismiss button */}
                  <button
                    onClick={() => handleDismiss(implication.id)}
                    className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="p-4 pr-10">
                    {/* Main content - click to expand */}
                    <button
                      onClick={() => toggleExpanded(implication.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          {/* Perceived Constant → Archetype Channel */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              {implication.perceivedConstant}
                            </span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-primary">
                              {implication.archetypeChannel}
                            </span>
                          </div>

                          {/* Factor badges */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {implication.biologyFactors.map((factor) => (
                              <Badge
                                key={factor}
                                variant="secondary"
                                className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              >
                                Biology: {factor}
                              </Badge>
                            ))}
                            {implication.environmentFactors.map((factor) => (
                              <Badge
                                key={factor}
                                variant="secondary"
                                className="text-xs bg-green-500/10 text-green-600 dark:text-green-400"
                              >
                                Environment: {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <ChevronDown
                          className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 mt-1 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {implication.explanation}
                        </p>

                        {implication.suggestedArchetypeForm && (
                          <div className="p-3 rounded bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-primary">
                                Suggested Archetype Form
                              </span>
                            </div>
                            <p className="text-sm italic">
                              "{implication.suggestedArchetypeForm}"
                            </p>
                          </div>
                        )}

                        {onApply && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApply(implication);
                            }}
                            className="gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Apply to Archetypes
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Restore dismissed */}
            {dismissedIds.size > 0 && (
              <button
                onClick={() => setDismissedIds(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Show {dismissedIds.size} dismissed suggestion{dismissedIds.size !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GlassPanel>
  );
};

export default SuggestedImplications;

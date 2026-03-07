import { useState } from "react";
import { ChevronDown, Target } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { useAllPrompts } from "@/hooks/use-writing-prompts";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type WritingPrompt,
} from "@/lib/writing/prompts";

interface PromptBrowserProps {
  onStartWriting: (prompt: WritingPrompt) => void;
}

export function PromptBrowser({ onStartWriting }: PromptBrowserProps) {
  const [expanded, setExpanded] = useState(false);
  const { prompts, isLoading } = useAllPrompts();

  return (
    <section className="mb-10">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-tier-3 hover:text-tier-1 transition-colors text-sm mb-4"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
        Browse All Prompts ({isLoading ? "..." : prompts.length})
      </button>

      {expanded && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <GlassPanel key={i} className="p-4 h-28 animate-pulse" />
              ))
            : prompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onStartWriting(p)}
                  className="text-left group"
                >
                  <GlassPanel hover className="p-4 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="glow"
                        className="text-[9px] px-1.5 py-0"
                      >
                        {CATEGORY_LABELS[p.category]}
                      </Badge>
                      <Badge
                        variant="glow-amber"
                        className="text-[9px] px-1.5 py-0"
                      >
                        {DIFFICULTY_LABELS[p.difficulty]}
                      </Badge>
                    </div>
                    <h4 className="font-heading text-xs font-light uppercase tracking-[1.5px] text-tier-1 mb-1.5">
                      {p.title}
                    </h4>
                    <p className="text-xs text-tier-3 italic leading-relaxed line-clamp-2 mb-auto">
                      {p.prompt}
                    </p>
                    {p.wordGoal && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Target className="w-3 h-3 text-tier-5" />
                        <span className="font-mono text-[10px] text-tier-5">
                          {p.wordGoal} words
                        </span>
                      </div>
                    )}
                  </GlassPanel>
                </button>
              ))}
        </div>
      )}
    </section>
  );
}

import { PenTool, Target } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTodaysPrompt } from "@/hooks/use-writing-prompts";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type WritingPrompt,
} from "@/lib/writing/prompts";

interface PromptCardProps {
  onStartWriting: (prompt: WritingPrompt) => void;
}

export function PromptCard({ onStartWriting }: PromptCardProps) {
  const { prompt, isLoading, source } = useTodaysPrompt();

  return (
    <GlassPanel glow className="p-6 md:p-8">
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-white/[0.06] rounded-xs" />
          <div className="h-6 w-64 bg-white/[0.06] rounded-xs" />
          <div className="h-4 w-full bg-white/[0.06] rounded-xs" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="glow">
                {CATEGORY_LABELS[prompt.category]}
              </Badge>
              <Badge variant="glow-amber">
                {DIFFICULTY_LABELS[prompt.difficulty]}
              </Badge>
            </div>
            <span className="font-mono text-[12px] text-t4 uppercase tracking-[1.5px] ml-auto">
              {source === "scheduled"
                ? "Scheduled Prompt"
                : source === "featured"
                  ? "Featured Prompt"
                  : "Daily Prompt"}
            </span>
          </div>

          <h2 className="font-heading text-lg font-light uppercase tracking-[2px] text-t1 mb-3">
            {prompt.title}
          </h2>

          <p className="text-t2 italic leading-relaxed line-clamp-3 mb-4">
            {prompt.prompt}
          </p>

          <div className="flex items-center justify-between">
            {prompt.wordGoal && (
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-t4" />
                <span className="font-mono text-xs text-t4">
                  {prompt.wordGoal} words
                </span>
              </div>
            )}

            <Button
              onClick={() => onStartWriting(prompt)}
              className="ml-auto gap-2"
            >
              <PenTool className="w-4 h-4" />
              Start Writing
            </Button>
          </div>
        </>
      )}
    </GlassPanel>
  );
}

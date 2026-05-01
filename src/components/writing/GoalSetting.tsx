import { useState, useCallback } from "react";
import { Target } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";

const QUICK_GOALS = [250, 500, 750, 1000];

interface GoalSettingProps {
  /** Compact mode hides the label text, used in WriteSheet footer */
  compact?: boolean;
}

export function GoalSetting({ compact = false }: GoalSettingProps) {
  const { preferences, updatePreferences } = useWritingPreferences();
  const [localGoal, setLocalGoal] = useState(preferences.dailyGoalWords);
  const [open, setOpen] = useState(false);

  const handleSave = useCallback(
    (value: number) => {
      const clamped = Math.max(100, Math.min(10000, value));
      setLocalGoal(clamped);
      updatePreferences({ dailyGoalWords: clamped });
    },
    [updatePreferences]
  );

  // Sync local state when popover opens
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) setLocalGoal(preferences.dailyGoalWords);
      setOpen(nextOpen);
    },
    [preferences.dailyGoalWords]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-t4 hover:text-t2 transition-colors"
        >
          <Target className="w-3.5 h-3.5" />
          {!compact && (
            <span className="font-mono text-[10px]">
              {preferences.dailyGoalWords} words
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-3">
          <Label>Daily Word Goal</Label>
          <Input
            type="number"
            min={100}
            max={10000}
            step={100}
            value={localGoal}
            onChange={(e) => setLocalGoal(Number(e.target.value))}
            onBlur={() => handleSave(localGoal)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave(localGoal);
            }}
            className="bg-transparent border-white/[0.08] rounded-xs font-mono text-sm"
          />
          <div className="flex items-center gap-1.5">
            {QUICK_GOALS.map((g) => (
              <Button
                key={g}
                variant="outline"
                size="sm"
                className={`flex-1 text-[10px] px-0 h-7 ${
                  localGoal === g ? "border-primary/40 text-primary" : ""
                }`}
                onClick={() => handleSave(g)}
              >
                {g}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

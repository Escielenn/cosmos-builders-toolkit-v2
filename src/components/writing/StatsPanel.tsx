import { useState } from "react";
import { ChevronDown, Flame, BarChart3 } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GoalSetting } from "@/components/writing/GoalSetting";
import { useWritingStats } from "@/hooks/use-writing-stats";
import type { WritingEntryWithWorld } from "@/hooks/use-writing-entries";

interface StatsPanelProps {
  entries: WritingEntryWithWorld[];
  dailyGoalWords: number;
}

function StatCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <GlassPanel className="p-3">
      <span className="block text-[12px] font-medium uppercase tracking-[1.5px] text-t3 mb-1.5">
        {label}
      </span>
      {children}
    </GlassPanel>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function StatsPanel({ entries, dailyGoalWords }: StatsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const stats = useWritingStats(entries, dailyGoalWords);

  const progressPercent = dailyGoalWords > 0
    ? Math.min((stats.wordsToday / dailyGoalWords) * 100, 100)
    : 0;

  return (
    <section className="mb-6">
      {/* Always-visible summary row */}
      <GlassPanel className="p-4 mb-3">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Daily goal progress */}
          <div className="flex items-center gap-3 flex-1 min-w-[180px]">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
                  Today
                </span>
                <span className="font-mono text-[12px] text-t2">
                  {formatNumber(stats.wordsToday)}
                  <span className="text-t4"> / {formatNumber(dailyGoalWords)}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-xs bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-primary rounded-xs transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <GoalSetting compact />
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1.5">
            <Flame
              className={`w-4 h-4 ${
                stats.currentStreak >= 1 ? "text-primary" : "text-t4"
              }`}
            />
            <span className="font-mono text-sm text-t1">
              {stats.currentStreak}
            </span>
            <span className="text-t4 text-xs">
              day streak
            </span>
          </div>

          {/* Total words */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-mono text-sm text-t1">
              {formatNumber(stats.totalWords)}
            </span>
            <span className="text-t4 text-xs">
              total words
            </span>
          </div>

          {/* Total entries */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-mono text-sm text-t1">
              {formatNumber(stats.totalEntries)}
            </span>
            <span className="text-t4 text-xs">
              {stats.totalEntries === 1 ? "entry" : "entries"}
            </span>
          </div>
        </div>
      </GlassPanel>

      {/* Expand for detailed stats */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-t4 hover:text-t2 transition-colors text-xs mb-3"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
        <BarChart3 className="w-3.5 h-3.5" />
        {expanded ? "Hide details" : "More stats"}
      </button>

      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Words This Week */}
          <StatCell label="Words This Week">
            <span className="font-mono text-t1">
              {formatNumber(stats.wordsThisWeek)}
            </span>
          </StatCell>

          {/* Longest Streak */}
          <StatCell label="Longest Streak">
            <div className="flex items-center gap-2">
              <span className="font-mono text-t1">
                {stats.longestStreak}
              </span>
              <span className="text-t4 text-xs">
                {stats.longestStreak === 1 ? "day" : "days"}
              </span>
            </div>
          </StatCell>

          {/* Entries This Month */}
          <StatCell label="This Month">
            <div className="flex items-center gap-2">
              <span className="font-mono text-t1">
                {formatNumber(stats.entriesThisMonth)}
              </span>
              <span className="text-t4 text-xs">
                {stats.entriesThisMonth === 1 ? "entry" : "entries"}
              </span>
            </div>
          </StatCell>

          {/* Daily Goal */}
          <StatCell label="Daily Goal">
            <GoalSetting />
          </StatCell>
        </div>
      )}
    </section>
  );
}

/**
 * React Query hooks for Sanity CMS writing prompts.
 * Falls back to static prompts when Sanity returns empty.
 */

import { useQuery } from "@tanstack/react-query";
import {
  getWritingPrompts,
  getTodaysSanityPrompt,
  getFeaturedWritingPrompts,
  adaptSanityPrompt,
} from "@/lib/sanity/writing-prompts";
import {
  WRITING_PROMPTS,
  getTodaysPrompt,
  type WritingPrompt,
} from "@/lib/writing/prompts";

// ── All Prompts ─────────────────────────────────────────────────────────

/** Fetch all Sanity prompts, adapted to WritingPrompt interface. Falls back to static. */
export function useAllPrompts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["writing-prompts"],
    queryFn: async (): Promise<WritingPrompt[]> => {
      const sanityPrompts = await getWritingPrompts();
      if (sanityPrompts.length > 0) {
        return sanityPrompts.map(adaptSanityPrompt);
      }
      return WRITING_PROMPTS;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    prompts: data ?? WRITING_PROMPTS,
    isLoading,
    error,
  };
}

// ── Today's Prompt ──────────────────────────────────────────────────────

type PromptSource = "scheduled" | "featured" | "static";

interface TodaysPromptResult {
  prompt: WritingPrompt;
  isLoading: boolean;
  source: PromptSource;
}

/**
 * Three-tier prompt resolution:
 * 1. Sanity prompt with scheduledDate == today
 * 2. Random featured Sanity prompt (seeded by day-of-year)
 * 3. Static getTodaysPrompt() fallback
 */
export function useTodaysPrompt(): TodaysPromptResult {
  const { data, isLoading } = useQuery({
    queryKey: ["writing-prompts", "today"],
    queryFn: async (): Promise<{
      prompt: WritingPrompt;
      source: PromptSource;
    }> => {
      // Tier 1: scheduled prompt for today
      const scheduled = await getTodaysSanityPrompt();
      if (scheduled) {
        return { prompt: adaptSanityPrompt(scheduled), source: "scheduled" };
      }

      // Tier 2: random featured prompt (seeded by day-of-year)
      const featured = await getFeaturedWritingPrompts();
      if (featured.length > 0) {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor(
          (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        const pick = featured[dayOfYear % featured.length];
        return { prompt: adaptSanityPrompt(pick), source: "featured" };
      }

      // Tier 3: static fallback
      return { prompt: getTodaysPrompt(), source: "static" };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // While loading, show static immediately (no flash of empty)
  const fallback = getTodaysPrompt();

  return {
    prompt: data?.prompt ?? fallback,
    isLoading,
    source: data?.source ?? "static",
  };
}

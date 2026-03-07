import { sanityClient } from "./client";
import type { SanityWritingPrompt } from "./types";
import type {
  WritingPrompt,
  PromptCategory,
  PromptDifficulty,
} from "@/lib/writing/prompts";

// ── Projection ──────────────────────────────────────────────────────────

const writingPromptProjection = `{
  _id,
  title,
  prompt,
  category,
  difficulty,
  wordGoal,
  scheduledDate,
  featured
}`;

// ── Adapter ─────────────────────────────────────────────────────────────

export function adaptSanityPrompt(sp: SanityWritingPrompt): WritingPrompt {
  return {
    id: sp._id,
    title: sp.title,
    prompt: sp.prompt,
    category: sp.category as PromptCategory,
    difficulty: sp.difficulty as PromptDifficulty,
    wordGoal: sp.wordGoal,
  };
}

// ── Queries ─────────────────────────────────────────────────────────────

export async function getWritingPrompts(): Promise<SanityWritingPrompt[]> {
  const query = `*[_type == "writingPrompt"] | order(title asc) ${writingPromptProjection}`;
  return sanityClient.fetch(query);
}

export async function getTodaysSanityPrompt(): Promise<SanityWritingPrompt | null> {
  const today = new Date().toISOString().split("T")[0];
  const query = `*[_type == "writingPrompt" && scheduledDate == $today][0] ${writingPromptProjection}`;
  return sanityClient.fetch(query, { today });
}

export async function getFeaturedWritingPrompts(): Promise<
  SanityWritingPrompt[]
> {
  const query = `*[_type == "writingPrompt" && featured == true] | order(title asc) ${writingPromptProjection}`;
  return sanityClient.fetch(query);
}

/**
 * Studio Home data (Cowork Implementation Guide §3), mapped onto the
 * LIVE schema: projects→worlds, manuscript→writing_entries,
 * cast→entities(character), scratchpad→world_notes.
 * Streaks derive from writing_entries activity dates (approximation
 * until the sessions/word_events rollup lands with the Phase-4 editor).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
export { lastSentence } from "@/lib/text";

export interface StudioWorld {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
}

export interface StudioEntry {
  id: string;
  title: string | null;
  content: string | null;
  word_count: number | null;
  updated_at: string;
  world_id: string | null;
}

export interface StudioCharacter {
  id: string;
  name: string;
  summary: string | null;
  color: string | null;
  tags: string[] | null;
  world_id: string;
}

export interface StudioNote {
  id: string;
  title: string;
  content: string;
  world_id: string;
  updated_at: string;
}

export interface StudioData {
  worlds: StudioWorld[];
  latestEntry: StudioEntry | null;
  recentEntries: StudioEntry[];
  characters: StudioCharacter[];
  notes: StudioNote[];
  /** 14 cells, oldest→today: true = wrote that day */
  activityCells: boolean[];
  streakDays: number;
  wordsToday: number;
  totalWords: number;
  entriesThisMonth: number;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function useStudioData() {
  const { user } = useAuth();

  return useQuery<StudioData>({
    queryKey: ["studio-home", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const uid = user!.id;

      const [worldsRes, entriesRes, charsRes, notesRes] = await Promise.all([
        supabase
          .from("worlds")
          .select("id, name, description, updated_at")
          .eq("user_id", uid)
          .is("archived_at", null)
          .order("updated_at", { ascending: false })
          .limit(8),
        // Manuscript store: world_entries documents (SF-II one writing model)
        supabase
          .from("world_entries")
          .select("id, title, content, updated_at, world_id")
          .eq("created_by", uid)
          .in("entry_type", ["document", "lore"])
          .order("updated_at", { ascending: false })
          .limit(60),
        supabase
          .from("entities")
          .select("id, name, summary, color, tags, world_id")
          .eq("user_id", uid)
          .eq("entity_type", "character")
          .order("updated_at", { ascending: false })
          .limit(6),
        supabase
          .from("world_notes")
          .select("id, title, content, world_id, updated_at")
          .eq("user_id", uid)
          .order("updated_at", { ascending: false })
          .limit(4),
      ]);

      const worlds = (worldsRes.data ?? []) as StudioWorld[];
      const wordCount = (html: string | null): number => {
        if (!html) return 0;
        const t = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
        return t ? t.split(/\s+/).length : 0;
      };
      const entries = ((entriesRes.data ?? []) as Array<Omit<StudioEntry, "word_count">>).map(
        (e) => ({ ...e, word_count: wordCount(e.content) }),
      ) as StudioEntry[];
      const characters = (charsRes.data ?? []) as StudioCharacter[];
      const notes = (notesRes.data ?? []) as StudioNote[];

      // Activity cells + streak from entry-touch dates
      const touched = new Set(entries.map((e) => e.updated_at.slice(0, 10)));
      const cells: boolean[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        cells.push(touched.has(dayKey(d)));
      }
      let streakDays = 0;
      for (let i = 0; ; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (touched.has(dayKey(d))) streakDays++;
        else if (i === 0) continue; // today not yet written doesn't break the streak
        else break;
        if (i > 365) break;
      }

      const todayKey = dayKey(new Date());
      const monthKey = todayKey.slice(0, 7);
      const wordsToday = entries
        .filter((e) => e.updated_at.slice(0, 10) === todayKey)
        .reduce((n, e) => n + (e.word_count ?? 0), 0);
      const totalWords = entries.reduce((n, e) => n + (e.word_count ?? 0), 0);
      const entriesThisMonth = entries.filter((e) => e.updated_at.slice(0, 7) === monthKey).length;

      return {
        worlds,
        latestEntry: entries[0] ?? null,
        recentEntries: entries.slice(0, 5),
        characters,
        notes,
        activityCells: cells,
        streakDays,
        wordsToday,
        totalWords,
        entriesThisMonth,
      };
    },
  });
}
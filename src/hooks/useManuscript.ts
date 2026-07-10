/**
 * Manuscript editor data layer (Implementation Guide §4).
 * writing_entries IS the scene store (SF-II: one writing model);
 * binder_nodes arranges entries into Books→Parts→Chapters→Scenes;
 * scene_pins pins world entities to a scene; writing_sessions is the
 * per-day word rollup behind streaks.
 *
 * NOTE: the new tables aren't in the generated Supabase types yet
 * (regen rides the next `supabase gen types` pass), so this module
 * uses a locally-typed untyped client. Keep all access to the new
 * tables inside this file.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type BinderKind = "book" | "part" | "chapter" | "scene" | "folder" | "research" | "trash";
export type SceneStatus = "todo" | "draft1" | "draft2" | "final";

export interface BinderNode {
  id: string;
  world_id: string;
  parent_id: string | null;
  kind: BinderKind;
  title: string;
  entry_id: string | null;
  sort_order: number;
}

export interface SceneEntry {
  id: string;
  title: string | null;
  content: string | null;
  word_count: number | null;
  synopsis: string | null;
  status: SceneStatus;
  time_label: string | null;
  target_words: number | null;
  world_id: string | null;
  updated_at: string;
}

export interface ScenePin {
  id: string;
  entry_id: string;
  entity_id: string;
  entity?: { id: string; name: string; entity_type: string; color: string | null };
}

export const STATUS_DOT: Record<SceneStatus, string> = {
  todo: "hsl(var(--sf-text-ghost))",
  draft1: "hsl(var(--sf-amber))",
  draft2: "hsl(var(--sf-stellar))",
  final: "hsl(var(--sf-teal))",
};

export function countWords(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
}

// ── scene ───────────────────────────────────────────────────────────

export function useScene(entryId: string | undefined) {
  return useQuery<SceneEntry | null>({
    queryKey: ["scene", entryId],
    enabled: !!entryId,
    queryFn: async () => {
      const { data, error } = await db
        .from("writing_entries")
        .select("id, title, content, word_count, synopsis, status, time_label, target_words, world_id, updated_at")
        .eq("id", entryId)
        .maybeSingle();
      if (error) throw error;
      return data as SceneEntry | null;
    },
  });
}

export function useSaveScene(entryId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<SceneEntry> & { _wordsDelta?: number }) => {
      const { _wordsDelta, ...fields } = patch;
      const { error } = await db
        .from("writing_entries")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", entryId);
      if (error) throw error;
      // roll positive word deltas into today's session
      if (user && _wordsDelta && _wordsDelta > 0) {
        const day = new Date().toISOString().slice(0, 10);
        const { data: row } = await db
          .from("writing_sessions")
          .select("words")
          .eq("user_id", user.id)
          .eq("day", day)
          .maybeSingle();
        await db.from("writing_sessions").upsert({
          user_id: user.id,
          day,
          words: (row?.words ?? 0) + _wordsDelta,
          updated_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scene", entryId] });
      qc.invalidateQueries({ queryKey: ["binder"] });
    },
  });
}

// ── binder ──────────────────────────────────────────────────────────

export function useBinder(worldId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery<{ nodes: BinderNode[]; unfiled: SceneEntry[] }>({
    queryKey: ["binder", worldId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const nodesQ = worldId
        ? db.from("binder_nodes").select("id, world_id, parent_id, kind, title, entry_id, sort_order").eq("world_id", worldId).order("sort_order")
        : Promise.resolve({ data: [], error: null });
      const entriesQ = db
        .from("writing_entries")
        .select("id, title, content, word_count, synopsis, status, time_label, target_words, world_id, updated_at")
        .eq("user_id", user!.id)
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .limit(100);
      const [nodesRes, entriesRes] = await Promise.all([nodesQ, entriesQ]);
      if (nodesRes.error) throw nodesRes.error;
      if (entriesRes.error) throw entriesRes.error;
      const nodes = (nodesRes.data ?? []) as BinderNode[];
      const filedIds = new Set(nodes.map((n) => n.entry_id).filter(Boolean));
      const entries = (entriesRes.data ?? []) as SceneEntry[];
      const unfiled = entries.filter(
        (e) => !filedIds.has(e.id) && (worldId ? e.world_id === worldId : true),
      );
      return { nodes, unfiled };
    },
  });
}

export function useBinderMutations(worldId: string | null | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["binder"] });

  const createNode = useMutation({
    mutationFn: async (input: { kind: BinderKind; title: string; parent_id?: string | null; entry_id?: string | null; sort_order?: number }) => {
      if (!user || !worldId) throw new Error("no world");
      const { data, error } = await db
        .from("binder_nodes")
        .insert({ user_id: user.id, world_id: worldId, parent_id: input.parent_id ?? null, kind: input.kind, title: input.title, entry_id: input.entry_id ?? null, sort_order: input.sort_order ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return data as BinderNode;
    },
    onSuccess: invalidate,
  });

  const createScene = useMutation({
    mutationFn: async (input: { title: string; parent_id?: string | null }) => {
      if (!user || !worldId) throw new Error("no world");
      const { data: entry, error } = await db
        .from("writing_entries")
        .insert({ user_id: user.id, world_id: worldId, title: input.title, content: "", word_count: 0, status: "todo" })
        .select("id")
        .single();
      if (error) throw error;
      const { error: nodeErr } = await db
        .from("binder_nodes")
        .insert({ user_id: user.id, world_id: worldId, parent_id: input.parent_id ?? null, kind: "scene", title: input.title, entry_id: entry.id });
      if (nodeErr) throw nodeErr;
      return entry.id as string;
    },
    onSuccess: invalidate,
  });

  return { createNode, createScene };
}

// ── pins ────────────────────────────────────────────────────────────

export function useScenePins(entryId: string | undefined) {
  return useQuery<ScenePin[]>({
    queryKey: ["scene-pins", entryId],
    enabled: !!entryId,
    queryFn: async () => {
      const { data, error } = await db
        .from("scene_pins")
        .select("id, entry_id, entity_id, entity:entities(id, name, entity_type, color)")
        .eq("entry_id", entryId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as ScenePin[];
    },
  });
}

export function usePinMutations(entryId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["scene-pins", entryId] });

  const pin = useMutation({
    mutationFn: async (entityId: string) => {
      if (!user || !entryId) throw new Error("no scene");
      const { error } = await db
        .from("scene_pins")
        .upsert({ user_id: user.id, entry_id: entryId, entity_id: entityId }, { onConflict: "entry_id,entity_id" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unpin = useMutation({
    mutationFn: async (pinId: string) => {
      const { error } = await db.from("scene_pins").delete().eq("id", pinId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { pin, unpin };
}

/** Latest entry id, for the /write index redirect. */
export function useLatestEntryId() {
  const { user } = useAuth();
  return useQuery<string | null>({
    queryKey: ["latest-entry", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from("writing_entries")
        .select("id")
        .eq("user_id", user!.id)
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.id ?? null;
    },
  });
}

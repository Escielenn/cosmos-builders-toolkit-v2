import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useAllWorksheets } from "@/hooks/use-all-worksheets";
import { useWritingEntries } from "@/hooks/use-writing-entries";
import { useWritingStats } from "@/hooks/use-writing-stats";
import { useEarnedBadges, useEarnBadge } from "@/hooks/use-badges";
import { useBadgeContext } from "@/contexts/BadgeContext";
import { BADGE_DEFINITIONS, type BadgeEvalData } from "@/lib/badges/definitions";
import { TOOL_WIKI } from "@/lib/tool-wiki-data";
import { supabase } from "@/integrations/supabase/client";

/**
 * Watches React Query cache and evaluates badge conditions.
 * Mount once in the app (via BadgeEvaluatorMount).
 */
export function useBadgeEvaluator() {
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const { worksheets } = useAllWorksheets();
  const { entries } = useWritingEntries();
  const stats = useWritingStats(entries, 0);
  const { earnedSet, isLoading: badgesLoading } = useEarnedBadges();
  const earnBadge = useEarnBadge();
  const { enqueueEarnedBadge } = useBadgeContext();

  // Debounce timer ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track what we've already processed this session to avoid re-enqueuing
  const processedRef = useRef(new Set<string>());
  // Sharing data (fetched once per session, refreshed on world changes)
  const [sharingData, setSharingData] = useState({
    shareLinkCount: 0,
    totalShareViews: 0,
    worldsWithCollaborators: 0,
    acceptedInviteCount: 0,
  });

  // Fetch sharing data when user or worlds change
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const [wsShares, worldShares, collabs, invites] = await Promise.all([
        supabase
          .from("worksheet_link_shares")
          .select("view_count")
          .eq("owner_id", user.id)
          .eq("enabled", true),
        supabase
          .from("world_link_shares")
          .select("view_count")
          .eq("owner_id", user.id)
          .eq("enabled", true),
        supabase
          .from("world_collaborators")
          .select("world_id")
          .in("world_id", worlds.map((w) => w.id)),
        supabase
          .from("world_invites")
          .select("status")
          .eq("invited_by", user.id)
          .eq("status", "accepted"),
      ]);

      if (cancelled) return;

      const wsCount = wsShares.data?.length ?? 0;
      const wCount = worldShares.data?.length ?? 0;
      const wsViews = (wsShares.data ?? []).reduce((s, r) => s + (r.view_count ?? 0), 0);
      const wViews = (worldShares.data ?? []).reduce((s, r) => s + (r.view_count ?? 0), 0);
      const uniqueCollabWorlds = new Set((collabs.data ?? []).map((c) => c.world_id));

      setSharingData({
        shareLinkCount: wsCount + wCount,
        totalShareViews: wsViews + wViews,
        worldsWithCollaborators: uniqueCollabWorlds.size,
        acceptedInviteCount: invites.data?.length ?? 0,
      });
    })();

    return () => { cancelled = true; };
  }, [user, worlds]);

  useEffect(() => {
    if (!user || badgesLoading) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Compute per-tool worksheet counts for mastery badges
      const worksheetCountsByTool = new Map<string, number>();
      for (const ws of worksheets) {
        worksheetCountsByTool.set(
          ws.tool_type,
          (worksheetCountsByTool.get(ws.tool_type) ?? 0) + 1
        );
      }

      const evalData: BadgeEvalData = {
        worldCount: worlds.length,
        worlds: worlds.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
        })),
        worksheetCount: worksheets.length,
        worksheetToolTypes: worksheets.map((ws) => ws.tool_type),
        writingEntryCount: entries.length,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalWords: stats.totalWords,
        worksheetCascadePositions: worksheets
          .map((ws) => TOOL_WIKI[ws.tool_type]?.cascade)
          .filter((c): c is string => !!c),
        writingEntriesWithWorld: entries.filter((e) => e.world_id).length,
        worldWorksheetCounts: (() => {
          const m = new Map<string, Set<string>>();
          for (const ws of worksheets) {
            if (ws.world_id) {
              if (!m.has(ws.world_id)) m.set(ws.world_id, new Set());
              m.get(ws.world_id)!.add(ws.tool_type);
            }
          }
          return m;
        })(),
        worksheetTags: worksheets.map((ws) => (ws.tags as string[]) ?? []),
        writingEntryTags: entries.map((e) => e.tags ?? []),
        writingEntriesByWorld: (() => {
          const m = new Map<string, number>();
          for (const e of entries) {
            if (e.world_id) {
              m.set(e.world_id, (m.get(e.world_id) ?? 0) + 1);
            }
          }
          return m;
        })(),
        // Phase 4: Social & Sharing
        ...sharingData,
        // Phase 5: Mastery
        worksheetCountsByTool,
      };

      for (const badge of BADGE_DEFINITIONS) {
        if (earnedSet.has(badge.id)) continue;
        if (processedRef.current.has(badge.id)) continue;

        if (badge.evaluate(evalData)) {
          processedRef.current.add(badge.id);
          earnBadge.mutate(badge.id);
          enqueueEarnedBadge(badge.id);
        }
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    user,
    badgesLoading,
    worlds,
    worksheets,
    entries,
    stats.currentStreak,
    stats.longestStreak,
    earnedSet,
    earnBadge,
    enqueueEarnedBadge,
    sharingData,
  ]);
}

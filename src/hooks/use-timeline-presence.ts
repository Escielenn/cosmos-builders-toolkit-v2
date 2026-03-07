// Supabase Realtime Presence for Timeline collaborative viewing (Pro feature)

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UserPresence {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
  onlineAt: string;
}

const PRESENCE_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#22c55e", // green
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
];

function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

interface UseTimelinePresenceOptions {
  worksheetId: string | null | undefined;
  userId: string | null | undefined;
  displayName: string;
  avatarUrl: string | null;
  enabled: boolean; // only when Pro + worldId
}

export function useTimelinePresence({
  worksheetId,
  userId,
  displayName,
  avatarUrl,
  enabled,
}: UseTimelinePresenceOptions) {
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !worksheetId || !userId) {
      setPresences([]);
      return;
    }

    const channel = supabase.channel(`timeline:${worksheetId}`, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<UserPresence>();
        const users: UserPresence[] = [];
        for (const [, entries] of Object.entries(state)) {
          if (entries.length > 0) {
            const entry = entries[0];
            // Skip self
            if (entry.userId !== userId) {
              users.push(entry);
            }
          }
        }
        setPresences(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            displayName,
            avatarUrl,
            color: pickColor(userId),
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [enabled, worksheetId, userId, displayName, avatarUrl]);

  return { presences };
}

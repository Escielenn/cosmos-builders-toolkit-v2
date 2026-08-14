import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { FileText, Globe, StickyNote, Activity } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  name: string;
  type: "worksheet" | "entry" | "note";
  toolType?: string;
  updatedAt: string;
  linkTo: string;
}

const TYPE_ICONS: Record<ActivityItem["type"], typeof FileText> = {
  worksheet: FileText,
  entry: Globe,
  note: StickyNote,
};

const TYPE_LABELS: Record<ActivityItem["type"], string> = {
  worksheet: "Worksheet",
  entry: "Entry",
  note: "Note",
};

interface RecentActivityProps {
  worldId: string;
}

export default function RecentActivity({ worldId }: RecentActivityProps) {
  const { user } = useAuth();

  const { data: items, isLoading } = useQuery({
    queryKey: ["recent-activity", worldId],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!worldId || !user) return [];

      // Fetch worksheets, entries, and notes in parallel
      const [worksheetsRes, entriesRes, notesRes] = await Promise.all([
        supabase
          .from("worksheets")
          .select("id, title, tool_type, updated_at")
          .eq("world_id", worldId)
          .is("archived_at", null)
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("world_entries")
          .select("id, title, entry_type, updated_at")
          .eq("world_id", worldId)
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("world_notes")
          .select("id, title, updated_at")
          .eq("world_id", worldId)
          .order("updated_at", { ascending: false })
          .limit(10),
      ]);

      const combined: ActivityItem[] = [];

      for (const w of worksheetsRes.data ?? []) {
        combined.push({
          id: w.id,
          name: w.title || "Untitled Worksheet",
          type: "worksheet",
          toolType: w.tool_type,
          updatedAt: w.updated_at,
          linkTo: `/tools/${w.tool_type}?worldId=${worldId}&worksheetId=${w.id}`,
        });
      }

      for (const e of entriesRes.data ?? []) {
        combined.push({
          id: e.id,
          name: e.title || "Untitled Entry",
          type: "entry",
          updatedAt: e.updated_at,
          linkTo: `/worlds/${worldId}/pages/${e.id}`,
        });
      }

      for (const n of notesRes.data ?? []) {
        combined.push({
          id: n.id,
          name: n.title || "Untitled Note",
          type: "note",
          updatedAt: n.updated_at,
          linkTo: `/worlds/${worldId}#notes`,
        });
      }

      // Sort by updated_at descending and take top 10
      combined.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return combined.slice(0, 10);
    },
    enabled: !!user && !!worldId,
    staleTime: 30_000, // 30s cache
  });

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="font-heading text-sm font-light uppercase tracking-[3px] text-sf-emerald mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          Recent Activity
        </h2>
        <GlassPanel className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </GlassPanel>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="font-heading text-sm font-light uppercase tracking-[3px] text-sf-emerald mb-3 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" />
        Recent Activity
      </h2>
      <GlassPanel className="p-0 divide-y divide-white/[0.04]">
        {items.map((item) => {
          const Icon = TYPE_ICONS[item.type];
          return (
            <Link
              key={`${item.type}-${item.id}`}
              to={item.linkTo}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors group"
            >
              <Icon className="w-3.5 h-3.5 text-t4 shrink-0 group-hover:text-t3 transition-colors" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-t2 truncate block group-hover:text-t1 transition-colors">
                  {item.name}
                </span>
              </div>
              <span className="font-mono text-[12px] uppercase tracking-[1px] text-t4 shrink-0">
                {TYPE_LABELS[item.type]}
              </span>
              <span className="font-mono text-[12px] text-t5 shrink-0 w-24 text-right">
                {formatDistanceToNow(new Date(item.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </Link>
          );
        })}
      </GlassPanel>
    </section>
  );
}

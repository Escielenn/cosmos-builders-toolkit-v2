// ---------------------------------------------------------------------------
// RecentActivityFeed — what changed last, across every world on the home
// page: documents, Codex entries and worksheets. Each row opens the thing
// where it lives (Studio, Codex page, in-world instrument).
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, FileText, PenLine } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { ActivityItem, ActivityKind } from "@/lib/recent-work";

const KIND_ICONS: Record<ActivityKind, typeof FileText> = {
  document: PenLine,
  codex: BookOpen,
  worksheet: FileText,
};

function ago(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return formatDistanceToNow(new Date(t), { addSuffix: true });
}

export default function RecentActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <GlassPanel className="p-6">
        <p className="font-mono text-sf-mono uppercase text-t3">NO ACTIVITY ON FILE.</p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-0">
      <ul className="divide-y divide-sf-line-hairline">
        {items.map((item) => {
          const Icon = KIND_ICONS[item.kind];
          return (
            <li key={item.key}>
              <Link
                to={item.href}
                className="flex min-h-hit items-center gap-3 px-4 py-2 hover:bg-sf-surface-elevated transition-colors duration-base"
              >
                <Icon className="w-4 h-4 shrink-0 text-t3" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sf-body text-t1">{item.title}</span>
                  <span className="block truncate text-xs text-t3">
                    {item.label}
                    {item.worldName ? ` · ${item.worldName}` : ""}
                  </span>
                </span>
                <span className="hidden sm:block shrink-0 font-mono text-sf-mono uppercase text-t4">
                  {ago(item.updatedAt).toUpperCase()}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </GlassPanel>
  );
}

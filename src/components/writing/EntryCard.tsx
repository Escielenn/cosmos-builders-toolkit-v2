import { formatDistanceToNow } from "date-fns";
import { FileText, Globe, Pencil } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import type { WritingEntryWithWorld } from "@/hooks/use-writing-entries";

interface EntryCardProps {
  entry: WritingEntryWithWorld;
  onClick: () => void;
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export function EntryCard({ entry, onClick }: EntryCardProps) {
  const excerpt = stripHtml(entry.content).trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left group"
    >
      <GlassPanel hover className="p-5 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-2">
          <FileText className="w-4 h-4 text-t4 mt-0.5 shrink-0" />
          <h3 className="font-heading text-sm font-light uppercase tracking-[2px] text-t1 truncate flex-1">
            {entry.title || "Untitled Entry"}
          </h3>
          <Pencil className="w-3 h-3 text-t4 mt-0.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
        </div>

        {excerpt ? (
          <p className="text-sm text-t2 leading-relaxed line-clamp-3 mb-auto">
            {excerpt}
          </p>
        ) : (
          <p className="text-sm text-t4 italic mb-auto">
            Empty entry
          </p>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 text-t4">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 3 && (
              <span className="text-[10px] text-t5">+{entry.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[11px] text-t4">
            {entry.word_count} {entry.word_count === 1 ? "word" : "words"}
          </span>

          <span className="text-t5 text-[10px]">&middot;</span>

          <span className="font-mono text-[11px] text-t4">
            {formatDistanceToNow(new Date(entry.updated_at), {
              addSuffix: true,
            })}
          </span>

          {entry.worlds && (
            <>
              <span className="text-t5 text-[10px]">&middot;</span>
              <span className="flex items-center gap-1.5 text-[11px] text-t3">
                <Globe className="w-3 h-3" />
                {entry.worlds.name}
              </span>
            </>
          )}
        </div>
      </GlassPanel>
    </button>
  );
}

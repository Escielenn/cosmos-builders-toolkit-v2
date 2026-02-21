import type { CodexElement } from "@/services/world-data";
import { formatDistanceToNow } from "date-fns";

interface CodexRecentEditsProps {
  items: CodexElement[];
  onItemClick: (element: CodexElement) => void;
}

const CodexRecentEdits = ({ items, onItemClick }: CodexRecentEditsProps) => {
  if (items.length === 0) return null;

  return (
    <div className="px-3 pt-2 pb-1">
      <div className="sf-divider mb-2" />
      <span className="font-heading text-[8px] uppercase tracking-[2px] text-muted-foreground/40 block mb-1.5">
        Recent Edits
      </span>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item)}
          className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center justify-between gap-2 py-1 px-1 text-left"
        >
          <span className="text-[11px] text-foreground/70 truncate">
            {item.title}
          </span>
          <span className="font-mono text-[8px] text-muted-foreground/40 whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CodexRecentEdits;

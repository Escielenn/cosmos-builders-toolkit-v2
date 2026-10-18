import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hueEdge } from "@/lib/hue-edge";

interface TagBadgeProps {
  name: string;
  color?: string;
  onRemove?: () => void;
  size?: "sm" | "md";
  className?: string;
}

const TagBadge = ({
  name,
  color = "#6366f1",
  onRemove,
  size = "md",
  className,
}: TagBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none font-medium transition-colors",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: hueEdge(color),
        borderWidth: 1,
      }}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-t1 transition-colors"
        >
          <X className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
        </button>
      )}
    </span>
  );
};

export default TagBadge;

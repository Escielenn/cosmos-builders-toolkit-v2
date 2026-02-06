import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WorksheetTitleProps {
  title: string | null;
  onRename: (newTitle: string) => Promise<void>;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Displays the worksheet title with inline editing capability.
 * Shows "Untitled" with option to add name if no title exists.
 */
export function WorksheetTitle({
  title,
  onRename,
  icon,
  disabled = false,
  className,
}: WorksheetTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    if (disabled) return;
    setEditValue(title || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editValue.trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onRename(editValue.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(title || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2 mt-2", className)}>
        {icon}
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter worksheet name..."
          className="h-8 text-base font-semibold max-w-xs"
          autoFocus
          disabled={isSaving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleSave}
          disabled={isSaving || !editValue.trim()}
        >
          <Check className="w-4 h-4 text-green-500" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-primary/10 w-fit group cursor-pointer hover:bg-primary/15 transition-colors",
        disabled && "cursor-default hover:bg-primary/10",
        className
      )}
      onClick={handleStartEdit}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === "Enter" && handleStartEdit()}
    >
      {icon}
      <span className={cn(
        "text-lg font-semibold",
        title ? "text-primary" : "text-muted-foreground italic"
      )}>
        {title || "Untitled"}
      </span>
      {!disabled && (
        <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

export default WorksheetTitle;

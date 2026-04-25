// ---------------------------------------------------------------------------
// PinToWritingButton — Pin any item to the Writing Space reference panel.
//
// Reads/writes localStorage directly using the same key format as
// useWritingPins, so it works from any page without needing to be inside
// the Writing Space.
// ---------------------------------------------------------------------------

import { useCallback } from "react";
import { Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWritingPins } from "@/hooks/use-writing-pins";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PinToWritingButtonProps {
  worldId: string;
  itemId: string;
  itemType: "worksheet" | "entity" | "note";
  title: string;
  /** Optional summary or first 200 chars — shown in the Pinned tab preview. */
  content?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PinToWritingButton({
  worldId,
  itemId,
  itemType,
  title,
  content = "",
  className,
}: PinToWritingButtonProps) {
  const { pins, addPin, removePin } = useWritingPins(worldId);
  const { toast } = useToast();

  const isPinned = pins.some(
    (p) => p.id === itemId && p.type === itemType,
  );

  const handleClick = useCallback(() => {
    if (isPinned) {
      removePin(itemId);
      toast({
        title: "Unpinned",
        description: "Removed from Writing Space.",
      });
    } else {
      addPin({
        id: itemId,
        type: itemType,
        title,
        content: content.slice(0, 200),
      });
      toast({
        title: "Pinned to Writing Space",
        description: `"${title}" will appear in your Writing Space reference panel.`,
      });
    }
  }, [isPinned, itemId, itemType, title, content, addPin, removePin, toast]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-[9px] font-sans font-medium uppercase tracking-[1.2px] transition-colors",
        isPinned
          ? "text-[#FFB800] hover:text-[#FF3366]"
          : "text-t4 hover:text-[#FFB800]",
        className,
      )}
      title={isPinned ? "Unpin from Writing Space" : "Pin to Writing Space"}
    >
      {isPinned ? (
        <PinOff className="w-3 h-3" />
      ) : (
        <Pin className="w-3 h-3" />
      )}
      <span>{isPinned ? "Unpin" : "Pin to Writing"}</span>
    </button>
  );
}

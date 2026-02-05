import { StickyNote } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import WorldNotes from "@/components/world/WorldNotes";

interface NotesSheetProps {
  worldId: string;
  worldName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotesSheet({ worldId, worldName, open, onOpenChange }: NotesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-display">
            <StickyNote className="w-5 h-5 text-primary" />
            World Notes
          </SheetTitle>
          <SheetDescription>
            {worldName ? `Notes for "${worldName}"` : "Add notes about your world"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <WorldNotes worldId={worldId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface NotesSheetTriggerProps {
  onClick: () => void;
  className?: string;
}

export function NotesSheetTrigger({ onClick, className }: NotesSheetTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={className}
      title="World Notes"
    >
      <StickyNote className="w-4 h-4" />
      <span className="sr-only">World Notes</span>
    </Button>
  );
}

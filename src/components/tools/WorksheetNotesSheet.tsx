import { lazy, Suspense } from "react";
import { StickyNote } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

interface WorksheetNotesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  content: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

export function WorksheetNotesSheet({
  open,
  onOpenChange,
  title = "Notes & Ideas",
  content,
  onChange,
  readOnly = false,
}: WorksheetNotesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-heading">
            <StickyNote className="w-5 h-5 text-primary" />
            {title}
          </SheetTitle>
          <SheetDescription>
            Jot down ideas, story hooks, or reminders for this worksheet.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <Suspense
            fallback={
              <div className="rounded-md border border-border bg-background/50 animate-pulse min-h-[300px]" />
            }
          >
            <RichTextEditor
              content={content}
              onChange={onChange}
              placeholder="Your notes and ideas..."
              readOnly={readOnly}
              minHeight="300px"
            />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}

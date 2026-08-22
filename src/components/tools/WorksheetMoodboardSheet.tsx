import { ImageIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { MoodboardSection } from "@/components/moodboard";
import type { MoodboardImage } from "@/hooks/use-moodboard";

interface WorksheetMoodboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worksheetId: string;
  images: MoodboardImage[];
  onImagesChange: (images: MoodboardImage[]) => void;
  disabled?: boolean;
}

export function WorksheetMoodboardSheet({
  open,
  onOpenChange,
  worksheetId,
  images,
  onImagesChange,
  disabled = false,
}: WorksheetMoodboardSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-sf-line">
          <SheetTitle className="flex items-center gap-2 font-heading">
            <ImageIcon className="w-5 h-5 text-primary" />
            Moodboard
            {images.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {images.length}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Add reference images to inspire your design.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <MoodboardSection
            worksheetId={worksheetId}
            images={images}
            onImagesChange={onImagesChange}
            disabled={disabled}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useState, useMemo } from "react";
import { Search, Check, ImageIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAllMoodboardImages, type MoodboardImageWithContext } from "@/hooks/use-all-moodboard-images";

interface MoodboardPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageUrl: string) => void;
  currentImageUrl?: string | null;
}

export function MoodboardPickerDialog({
  open,
  onOpenChange,
  onSelect,
  currentImageUrl,
}: MoodboardPickerDialogProps) {
  const { images, isLoading } = useAllMoodboardImages();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return images;
    const lower = search.toLowerCase();
    return images.filter(
      (img) =>
        img.worldName.toLowerCase().includes(lower) ||
        img.worksheetTitle.toLowerCase().includes(lower) ||
        (img.caption && img.caption.toLowerCase().includes(lower))
    );
  }, [images, search]);

  // Group by world name
  const grouped = useMemo(() => {
    const map = new Map<string, MoodboardImageWithContext[]>();
    for (const img of filtered) {
      const existing = map.get(img.worldName) || [];
      existing.push(img);
      map.set(img.worldName, existing);
    }
    return map;
  }, [filtered]);

  const handleSelect = (imageUrl: string) => {
    onSelect(imageUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Choose from Moodboard</DialogTitle>
          <DialogDescription>
            Select an image from your moodboard collection across all worksheets.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by world, worksheet, or caption..."
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="sm" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-t3">
              <ImageIcon className="w-8 h-8 mb-2" />
              <p className="text-sm">
                {images.length === 0
                  ? "NO REFERENCE IMAGES ON FILE."
                  : "No images match your search."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {Array.from(grouped.entries()).map(([worldName, worldImages]) => (
                <div key={worldName}>
                  <h4 className="text-xs font-medium text-t3 uppercase tracking-wider mb-2">
                    {worldName}
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {worldImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => handleSelect(image.url)}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                          currentImageUrl === image.url
                            ? "border-primary ring-2 ring-primary/50"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <img
                          src={image.url}
                          alt={image.caption || "Moodboard image"}
                          className="w-full h-full object-cover"
                        />
                        {currentImageUrl === image.url && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        {image.caption && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                            <p className="text-[10px] text-white truncate">{image.caption}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

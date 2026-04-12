import { useState } from "react";
import { Trash2, Pencil, Check, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MoodboardImage as MoodboardImageType } from "@/hooks/use-moodboard";

interface MoodboardImageProps {
  image: MoodboardImageType;
  onDelete: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
  onOpenLightbox: (image: MoodboardImageType) => void;
  disabled?: boolean;
}

export function MoodboardImage({
  image,
  onDelete,
  onUpdateCaption,
  onOpenLightbox,
  disabled = false,
}: MoodboardImageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(image.caption || "");
  const [imageError, setImageError] = useState(false);

  const handleSaveCaption = () => {
    onUpdateCaption(image.id, caption);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setCaption(image.caption || "");
    setIsEditing(false);
  };

  return (
    <div className="group relative rounded-lg overflow-hidden bg-muted/30 border border-border">
      {/* Image */}
      <div
        className="aspect-video cursor-pointer relative"
        onClick={() => !imageError && onOpenLightbox(image)}
      >
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-sm text-muted-foreground">Image not found</span>
          </div>
        ) : (
          <>
            <img
              src={image.url}
              alt={image.caption || "Moodboard image"}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            {/* Zoom overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </>
        )}
      </div>

      {/* Caption area */}
      <div className="p-2">
        {isEditing ? (
          <div className="flex gap-1">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveCaption();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveCaption} aria-label="Save caption">
              <Check className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit} aria-label="Cancel editing caption">
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "text-xs flex-1 truncate",
                image.caption ? "text-foreground" : "text-muted-foreground italic cursor-pointer hover:text-foreground"
              )}
              onClick={() => !disabled && setIsEditing(true)}
            >
              {image.caption || "Add caption..."}
            </p>
            {!disabled && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit caption"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => onDelete(image.id)}
                  aria-label="Delete image"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

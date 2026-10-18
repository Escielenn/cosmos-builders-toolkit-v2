import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { useStorageUrl } from "@/hooks/use-storage-url";

interface MoodboardLightboxProps {
  images: MoodboardImage[];
  currentImage: MoodboardImage | null;
  onClose: () => void;
  onNavigate: (image: MoodboardImage) => void;
}

export function MoodboardLightbox({
  images,
  currentImage,
  onClose,
  onNavigate,
}: MoodboardLightboxProps) {
  const currentIndex = currentImage ? images.findIndex((img) => img.id === currentImage.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(images[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, images, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(images[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, images, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (currentImage) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [currentImage]);

  const display = useStorageUrl(currentImage?.url);

  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--sf-scrim)] backdrop-blur-md flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-t1 hover:bg-sf-surface-elevated z-10"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Navigation - Previous */}
      {hasPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-t1 hover:bg-sf-surface-elevated z-10 h-12 w-12"
          onClick={handlePrev}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}

      {/* Navigation - Next */}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-t1 hover:bg-sf-surface-elevated z-10 h-12 w-12"
          onClick={handleNext}
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Image container */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {display.url ? (
          <img
            src={display.url}
            alt={currentImage.caption || "Moodboard image"}
            className="max-w-full max-h-[80vh] object-contain"
          />
        ) : (
          <p className="text-sm text-t2">
            {display.isError ? "IMAGE UNAVAILABLE." : "RETRIEVING IMAGE."}
          </p>
        )}

        {/* Caption */}
        {currentImage.caption && (
          <div className="mt-4 text-t1 text-center max-w-xl">
            <p>{currentImage.caption}</p>
          </div>
        )}

        {/* Counter */}
        <div className="mt-2 text-t3 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

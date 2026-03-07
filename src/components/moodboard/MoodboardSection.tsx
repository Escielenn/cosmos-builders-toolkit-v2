import { useState } from "react";
import { MoodboardUpload } from "./MoodboardUpload";
import { MoodboardImage } from "./MoodboardImage";
import { MoodboardLightbox } from "./MoodboardLightbox";
import { useMoodboard, type MoodboardImage as MoodboardImageType } from "@/hooks/use-moodboard";

interface MoodboardSectionProps {
  worksheetId: string;
  images: MoodboardImageType[];
  onImagesChange: (images: MoodboardImageType[]) => void;
  disabled?: boolean;
}

export function MoodboardSection({
  worksheetId,
  images,
  onImagesChange,
  disabled = false,
}: MoodboardSectionProps) {
  const [lightboxImage, setLightboxImage] = useState<MoodboardImageType | null>(null);

  const {
    uploadImage,
    addImageFromUrl,
    updateCaption,
    deleteImage,
    isUploading,
    isAddingUrl,
  } = useMoodboard({
    worksheetId,
    currentImages: images,
    onUpdate: onImagesChange,
  });

  const handleUpload = (file: File) => {
    uploadImage.mutate(file);
  };

  const handleAddUrl = (url: string) => {
    addImageFromUrl.mutate(url);
  };

  const handleUpdateCaption = (imageId: string, caption: string) => {
    updateCaption.mutate({ imageId, caption });
  };

  const handleDelete = (imageId: string) => {
    deleteImage.mutate(imageId);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {!disabled && (
        <MoodboardUpload
          onUpload={handleUpload}
          onAddUrl={handleAddUrl}
          isUploading={isUploading}
          isAddingUrl={isAddingUrl}
          disabled={disabled}
        />
      )}

      {/* Image gallery */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <MoodboardImage
              key={image.id}
              image={image}
              onDelete={handleDelete}
              onUpdateCaption={handleUpdateCaption}
              onOpenLightbox={setLightboxImage}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          NO IMAGES ON FILE.
        </p>
      )}

      {/* Lightbox */}
      <MoodboardLightbox
        images={images}
        currentImage={lightboxImage}
        onClose={() => setLightboxImage(null)}
        onNavigate={setLightboxImage}
      />
    </div>
  );
}

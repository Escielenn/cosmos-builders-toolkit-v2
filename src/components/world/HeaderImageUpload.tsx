import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Images } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MoodboardPickerDialog } from "@/components/moodboard/MoodboardPickerDialog";

import { mapError } from "@/lib/ship-voice";
import { promoteToPublicHeader } from "@/services/storage-urls";
import { useStorageUrl } from "@/hooks/use-storage-url";
interface HeaderImageUploadProps {
  currentImageUrl: string | null;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  showMoodboardPicker?: boolean;
  focusY?: number;
}

const HeaderImageUpload = ({
  currentImageUrl,
  onImageChange,
  disabled,
  className,
  showMoodboardPicker = true,
  focusY,
}: HeaderImageUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [moodboardPickerOpen, setMoodboardPickerOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "INVALID FILE TYPE.",
        description: "Select image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "FILE TOO LARGE.",
        description: "Image must be under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("world-headers")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "UPLOAD FAILED.",
        description: mapError(uploadError),
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("world-headers")
      .getPublicUrl(filePath);

    onImageChange(data.publicUrl);
    setIsUploading(false);

    toast({
      title: "IMAGE UPLOADED.",
      description: "Header image updated successfully.",
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onImageChange(null);
  };

  // Headers show on shared links and community cards, so they must sit in the
  // public world-headers bucket. A moodboard pick is copied there first.
  const handleMoodboardPick = async (url: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      onImageChange(await promoteToPublicHeader(url, user.id));
    } catch (err) {
      toast({
        title: "IMAGE NOT FILED.",
        description: mapError(err),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Legacy headers picked from a moodboard before it went private still
  // resolve for the owner.
  const preview = useStorageUrl(currentImageUrl);

  return (
    <div className={cn("relative", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
      />

      {currentImageUrl ? (
        <div className="relative w-full aspect-[3/1] rounded-none overflow-hidden border border-sf-line">
          <img
            src={preview.url ?? undefined}
            alt="World header"
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ objectPosition: `center ${focusY ?? 50}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--sf-scrim)] to-transparent flex items-end justify-between p-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                {isUploading ? (
                  <Loader variant="inline" size="sm" className="mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Change
              </Button>
              {showMoodboardPicker && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setMoodboardPickerOpen(true)}
                  disabled={disabled}
                >
                  <Images className="w-4 h-4 mr-2" />
                  From Moodboard
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-[3/1] rounded-none border-2 border-dashed border-sf-line-interactive hover:border-primary transition-colors flex flex-col items-center justify-center gap-3 bg-muted/30">
          {isUploading ? (
            <Loader />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-t3" />
              <span className="text-sm text-t3">
                Add a header image for your world
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                {showMoodboardPicker && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMoodboardPickerOpen(true)}
                    disabled={disabled}
                  >
                    <Images className="w-4 h-4 mr-2" />
                    From Moodboard
                  </Button>
                )}
              </div>
              <span className="text-xs text-t3">
                Recommended: 1200x400 or similar 3:1 ratio
              </span>
            </>
          )}
        </div>
      )}

      {showMoodboardPicker && (
        <MoodboardPickerDialog
          open={moodboardPickerOpen}
          onOpenChange={setMoodboardPickerOpen}
          onSelect={(url) => void handleMoodboardPick(url)}
          currentImageUrl={currentImageUrl}
        />
      )}
    </div>
  );
};

export default HeaderImageUpload;

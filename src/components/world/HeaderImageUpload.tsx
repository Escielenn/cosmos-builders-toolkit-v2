import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Images } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MoodboardPickerDialog } from "@/components/moodboard/MoodboardPickerDialog";

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
        title: "Invalid file type",
        description: "Select image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
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
        title: "Upload failed",
        description: uploadError.message,
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
      title: "Image uploaded",
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
        <div className="relative w-full aspect-[3/1] rounded-none overflow-hidden border border-sf-line-interactive">
          <img
            src={currentImageUrl}
            alt="World header"
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ objectPosition: `center ${focusY ?? 50}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-between p-3">
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
          onSelect={(url) => onImageChange(url)}
          currentImageUrl={currentImageUrl}
        />
      )}
    </div>
  );
};

export default HeaderImageUpload;

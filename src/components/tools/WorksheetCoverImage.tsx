import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Images } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MoodboardPickerDialog } from "@/components/moodboard/MoodboardPickerDialog";

interface WorksheetCoverImageProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  worksheetId: string;
  disabled?: boolean;
}

export function WorksheetCoverImage({
  imageUrl,
  onImageChange,
  worksheetId,
  disabled,
}: WorksheetCoverImageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [moodboardPickerOpen, setMoodboardPickerOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Select image file.",
        variant: "destructive",
      });
      return;
    }

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
    const filePath = `${user.id}/${worksheetId}/cover.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("moodboard-images")
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
      .from("moodboard-images")
      .getPublicUrl(filePath);

    onImageChange(data.publicUrl);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!imageUrl) {
    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading}
        />
        <div className="flex items-center gap-2 mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-t3 hover:text-t1 h-7"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader variant="inline" size="sm" className="mr-1.5" />
            ) : (
              <ImageIcon className="w-3 h-3 mr-1.5" />
            )}
            Add cover image
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-t3 hover:text-t1 h-7"
            onClick={() => setMoodboardPickerOpen(true)}
            disabled={disabled}
          >
            <Images className="w-3 h-3 mr-1.5" />
            From moodboard
          </Button>
        </div>
        <MoodboardPickerDialog
          open={moodboardPickerOpen}
          onOpenChange={setMoodboardPickerOpen}
          onSelect={(url) => onImageChange(url)}
          currentImageUrl={imageUrl}
        />
      </>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
      />
      <div className="relative w-full aspect-[3/1] rounded-none overflow-hidden border border-sf-border mt-2">
        <img
          src={imageUrl}
          alt="Worksheet cover"
          className="w-full h-full object-cover"
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
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onImageChange(null)}
            disabled={disabled || isUploading}
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      </div>
      <MoodboardPickerDialog
        open={moodboardPickerOpen}
        onOpenChange={setMoodboardPickerOpen}
        onSelect={(url) => onImageChange(url)}
        currentImageUrl={imageUrl}
      />
    </>
  );
}

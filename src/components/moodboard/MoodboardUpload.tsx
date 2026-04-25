import { useState, useRef, useCallback } from "react";
import { Upload, Link as LinkIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MoodboardUploadProps {
  onUpload: (file: File) => void;
  onAddUrl: (url: string) => void;
  isUploading: boolean;
  isAddingUrl: boolean;
  disabled?: boolean;
}

export function MoodboardUpload({
  onUpload,
  onAddUrl,
  isUploading,
  isAddingUrl,
  disabled = false,
}: MoodboardUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          onUpload(file);
        }
      }
    },
    [onUpload, disabled]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlValue.trim()) {
      onAddUrl(urlValue.trim());
      setUrlValue("");
      setShowUrlInput(false);
    }
  };

  const isLoading = isUploading || isAddingUrl;

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={disabled || isLoading}
      />

      {/* Drag-drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isLoading && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-sf-border hover:border-primary/50 hover:bg-muted/50",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader />
            <p className="text-sm text-t3">
              {isUploading ? "Uploading..." : "Adding..."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-t3" />
            <p className="text-sm text-t3">
              Drag & drop an image here, or click to select
            </p>
            <p className="text-xs text-t3/70">
              Max 5MB. JPG, PNG, GIF, WebP supported.
            </p>
          </div>
        )}
      </div>

      {/* URL input toggle */}
      {!showUrlInput ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(true)}
          disabled={disabled || isLoading}
          className="w-full"
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          Add from URL
        </Button>
      ) : (
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            disabled={disabled || isLoading}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!urlValue.trim() || disabled || isLoading}>
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowUrlInput(false);
              setUrlValue("");
            }}
          >
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}

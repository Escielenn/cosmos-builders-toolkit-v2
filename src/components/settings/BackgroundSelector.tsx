import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image, Check, Upload, X } from "lucide-react";
import { useBackground } from "@/hooks/use-background";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const BackgroundSelector = () => {
  const { backgroundId, setBackground, options, customBackground, setCustomBackground, clearCustomBackground } = useBackground();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomBackground(dataUrl);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Group options by category
  const defaultOptions = options.filter((o) => o.category === "default");
  const spaceOptions = options.filter((o) => o.category === "space");
  const gradientOptions = options.filter((o) => o.category === "gradient");

  const renderOption = (option: typeof options[0]) => {
    const isSelected = backgroundId === option.id && backgroundId !== "custom";
    const isGradient = option.type === "gradient" || option.type === "color";

    return (
      <button
        key={option.id}
        onClick={() => setBackground(option.id)}
        className={cn(
          "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
          isSelected
            ? "border-primary ring-2 ring-primary/50"
            : "border-border hover:border-primary/50"
        )}
      >
        {isGradient ? (
          <div
            className="w-full h-full"
            style={{ background: option.value }}
          />
        ) : option.url ? (
          <img
            src={option.url}
            alt={option.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-background starfield-preview" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <span className="absolute bottom-2 left-2 text-xs font-medium text-white">
          {option.name}
        </span>
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </button>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-3">
          <Image className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Background</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Choose Background
          </DialogTitle>
          <DialogDescription>
            Select a space-themed background for your workspace.
          </DialogDescription>
        </DialogHeader>

        {/* Default Section */}
        <div className="mt-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Default
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {defaultOptions.map(renderOption)}
          </div>
        </div>

        {/* Space Images Section */}
        <div className="mt-6">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Space Images
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {spaceOptions.map(renderOption)}
          </div>
        </div>

        {/* Gradients Section */}
        <div className="mt-6">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Gradients
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gradientOptions.map(renderOption)}
          </div>
        </div>

        {/* Custom Upload Section */}
        <div className="mt-6">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Custom
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            {customBackground ? (
              <button
                onClick={() => setBackground("custom")}
                className={cn(
                  "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                  backgroundId === "custom"
                    ? "border-primary ring-2 ring-primary/50"
                    : "border-border hover:border-primary/50"
                )}
              >
                <img
                  src={customBackground}
                  alt="Custom background"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute bottom-2 left-2 text-xs font-medium text-white">
                  Custom
                </span>
                {backgroundId === "custom" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearCustomBackground();
                  }}
                  className="absolute top-2 left-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center hover:bg-destructive/80"
                >
                  <X className="w-3 h-3 text-destructive-foreground" />
                </button>
              </button>
            ) : null}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 bg-muted/50"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Upload Image
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Photos from Unsplash • Max upload size: 5MB
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default BackgroundSelector;

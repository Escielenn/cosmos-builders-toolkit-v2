import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Image, Check, Upload, X, Palette, Sparkles, Shuffle, Film, Eye, EyeOff } from "lucide-react";
import { useBackground } from "@/hooks/use-background";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BackgroundSelector = () => {
  const { backgroundId, setBackground, options, customBackground, setCustomBackground, clearCustomBackground, hasUserPreference, resetToRandom, backgroundVisible, toggleBackgroundVisible } = useBackground();
  const [dialogOpen, setDialogOpen] = useState(false);
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
  const videoOptions = options.filter((o) => o.category === "video");
  const gradientOptions = options.filter((o) => o.category === "gradient");
  const colorOptions = options.filter((o) => o.category === "color");

  const renderOption = (option: typeof options[0]) => {
    const isSelected = backgroundId === option.id && backgroundId !== "custom";
    const isGradientOrColor = option.type === "gradient" || option.type === "color";

    return (
      <button
        key={option.id}
        onClick={() => setBackground(option.id)}
        className={cn(
          "relative aspect-video rounded-none overflow-hidden border-2 transition-all hover:scale-105",
          isSelected
            ? "border-primary ring-2 ring-primary/50"
            : "border-sf-border hover:border-primary/50"
        )}
      >
        {isGradientOrColor ? (
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
          <div className="absolute top-2 right-2 w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </button>
    );
  };

  // Determine which tab should be active based on current selection
  const getDefaultTab = () => {
    if (backgroundId === "custom") return "custom";
    const selected = options.find((o) => o.id === backgroundId);
    if (!selected) return "images";
    if (selected.category === "space" || selected.category === "default") return "images";
    if (selected.category === "video") return "videos";
    if (selected.category === "gradient") return "gradients";
    if (selected.category === "color") return "colors";
    return "images";
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "sf-nav-link inline-flex items-center justify-center w-9 h-9 transition-colors",
              backgroundVisible
                ? "text-t3 hover:text-primary"
                : "text-t3/40 hover:text-primary/60"
            )}
            onClick={toggleBackgroundVisible}
          >
            {backgroundVisible ? <Eye className="w-4 h-4 relative z-[1]" /> : <EyeOff className="w-4 h-4 relative z-[1]" />}
            <span className="sr-only">Toggle Background</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{backgroundVisible ? "Hide background" : "Show background"}</p>
        </TooltipContent>
      </Tooltip>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Choose Background
          </DialogTitle>
          <DialogDescription>
            Select a space-themed background for your workspace.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={getDefaultTab()} className="mt-4">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="images" className="gap-1.5">
              <Image className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Images</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-1.5">
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="gradients" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gradients</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Colors</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Custom</span>
            </TabsTrigger>
          </TabsList>

          {/* Images Tab */}
          <TabsContent value="images" className="mt-4 space-y-4">
            {/* Random Option */}
            <div>
              <h4 className="text-xs font-medium text-t3 uppercase tracking-wider mb-3">
                Auto-Rotate
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={resetToRandom}
                  className={cn(
                    "relative aspect-video rounded-none overflow-hidden border-2 transition-all hover:scale-105",
                    !hasUserPreference
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-sf-border hover:border-primary/50"
                  )}
                >
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-cyan-900/50 flex items-center justify-center">
                    <Shuffle className="w-8 h-8 text-white/70" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-xs font-medium text-white">
                    Random
                  </span>
                  <span className="absolute bottom-2 right-2 text-[10px] text-white/60">
                    Changes each visit
                  </span>
                  {!hasUserPreference && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-t3 uppercase tracking-wider mb-3">
                Default
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {defaultOptions.map(renderOption)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-t3 uppercase tracking-wider mb-3">
                Space Images
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {spaceOptions.map(renderOption)}
              </div>
            </div>
            <p className="text-xs text-t3 text-center">
              Photos from Unsplash
            </p>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {videoOptions.map((option) => {
                const isSelected = backgroundId === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setBackground(option.id)}
                    className={cn(
                      "relative aspect-video rounded-none overflow-hidden border-2 transition-all hover:scale-105",
                      isSelected
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-sf-border hover:border-primary/50"
                    )}
                  >
                    <video
                      src={option.url}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // .mov files won't play in Chrome/Firefox — show fallback
                        const el = e.currentTarget;
                        el.style.display = "none";
                        const fallback = el.nextElementSibling as HTMLElement | null;
                        if (fallback?.dataset.videoFallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      data-video-fallback
                      className="absolute inset-0 items-center justify-center"
                      style={{ display: "none", background: "linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0d1117 100%)" }}
                    >
                      <span className="text-[10px] font-mono text-t3 uppercase tracking-wider">{option.name}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-xs font-medium text-white">
                      {option.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-t3 text-center mt-4">
              Animated space backdrops
            </p>
          </TabsContent>

          {/* Gradients Tab */}
          <TabsContent value="gradients" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gradientOptions.map(renderOption)}
            </div>
            <p className="text-xs text-t3 text-center mt-4">
              Smooth gradient backgrounds
            </p>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {colorOptions.map(renderOption)}
            </div>
            <p className="text-xs text-t3 text-center mt-4">
              Solid color backgrounds for minimal distraction
            </p>
          </TabsContent>

          {/* Custom Tab */}
          <TabsContent value="custom" className="mt-4">
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
                    "relative aspect-video rounded-none overflow-hidden border-2 transition-all hover:scale-105",
                    backgroundId === "custom"
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-sf-border hover:border-primary/50"
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
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearCustomBackground();
                    }}
                    className="absolute top-2 left-2 w-5 h-5 rounded-sm bg-destructive flex items-center justify-center hover:bg-destructive/80"
                  >
                    <X className="w-3 h-3 text-sf-crimson-foreground" />
                  </button>
                </button>
              ) : null}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-video rounded-none overflow-hidden border-2 border-dashed border-sf-border hover:border-primary/50 transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 bg-muted/50"
              >
                <Upload className="w-6 h-6 text-t3" />
                <span className="text-xs font-medium text-t3">
                  Upload Image
                </span>
              </button>
            </div>
            <p className="text-xs text-t3 text-center mt-4">
              Max upload size: 5MB
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default BackgroundSelector;

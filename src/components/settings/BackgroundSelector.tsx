import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Check } from "lucide-react";
import { useBackground } from "@/hooks/use-background";
import { cn } from "@/lib/utils";

const BackgroundSelector = () => {
  const { backgroundId, setBackground, options } = useBackground();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Settings className="w-4 h-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Choose Background
          </DialogTitle>
          <DialogDescription>
            Select a space-themed background for your workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setBackground(option.id)}
              className={cn(
                "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                backgroundId === option.id
                  ? "border-primary ring-2 ring-primary/50"
                  : "border-border hover:border-primary/50"
              )}
            >
              {option.url ? (
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
              {backgroundId === option.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Photos from Unsplash
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default BackgroundSelector;

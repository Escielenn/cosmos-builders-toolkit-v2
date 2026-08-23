import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ALL_WORLD_PICS,
  WORLD_PIC_CATEGORIES,
  getWorldPicsByCategory,
  getWorldPicLabel,
  searchWorldPics,
  type WorldPicCategory,
} from "@/lib/world-pics-config";
import { Search } from "lucide-react";

interface WorldPicPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
}

const WorldPicPickerDialog = ({
  open,
  onOpenChange,
  onSelect,
}: WorldPicPickerDialogProps) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<WorldPicCategory | "All">("All");

  const filteredPics = useMemo(() => {
    let pics: string[];
    if (search.trim()) {
      pics = searchWorldPics(search);
    } else if (activeCategory === "All") {
      pics = ALL_WORLD_PICS;
    } else {
      pics = getWorldPicsByCategory(activeCategory);
    }
    return pics;
  }, [search, activeCategory]);

  const handleSelect = (filename: string) => {
    onSelect(`/world-pics/${filename}`);
    onOpenChange(false);
    setSearch("");
    setActiveCategory("All");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSearch(""); setActiveCategory("All"); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading font-light uppercase tracking-wider">
            Choose Illustration
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" />
          <Input
            placeholder="Search illustrations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveCategory("All"); }}
            className="pl-9"
          />
        </div>

        {/* Category tabs */}
        {!search.trim() && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory("All")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                activeCategory === "All"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-t3 hover:bg-muted"
              )}
            >
              All ({ALL_WORLD_PICS.length})
            </button>
            {WORLD_PIC_CATEGORIES.map((cat) => {
              const count = getWorldPicsByCategory(cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-t3 hover:bg-muted"
                  )}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredPics.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-t3 text-sm">
              No illustrations found
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 py-1 pr-1">
              {filteredPics.map((filename) => (
                <button
                  key={filename}
                  type="button"
                  onClick={() => handleSelect(filename)}
                  className="aspect-square rounded-none border border-transparent hover:border-primary hover:bg-primary/5 transition-all p-1.5 group"
                  title={getWorldPicLabel(filename)}
                >
                  <img
                    src={`/world-pics/${filename}`}
                    alt={getWorldPicLabel(filename)}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    draggable={false}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Count */}
        <div className="text-xs text-t3 text-center pt-1 border-t">
          {filteredPics.length} illustration{filteredPics.length !== 1 ? "s" : ""}
          {search.trim() ? ` matching "${search}"` : ""}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorldPicPickerDialog;

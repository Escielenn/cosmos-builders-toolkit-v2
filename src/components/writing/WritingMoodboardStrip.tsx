// ---------------------------------------------------------------------------
// WritingMoodboardStrip, Collapsible moodboard image strip above the editor.
//
// Collapsed: 32px bar with label, expand chevron, and 3-4 tiny thumbnails.
// Expanded:  160px horizontal scrollable row of moodboard images.
// ---------------------------------------------------------------------------

import { ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MoodboardImage {
  id: string;
  url: string;
  caption?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WritingMoodboardStripProps {
  images: MoodboardImage[];
  open: boolean;
  onToggle: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WritingMoodboardStrip({
  images,
  open,
  onToggle,
}: WritingMoodboardStripProps) {
  // Don't render at all if no images
  if (images.length === 0) return null;

  // Collapsed state, thin bar
  if (!open) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 border-b border-white/[0.06] bg-sf-surface/40 h-8">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-t4 hover:text-t2 transition-colors"
        >
          <ImageIcon className="w-3 h-3" />
          <span className="text-[9px] font-heading uppercase tracking-[1.5px]">
            Moodboard
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Tiny preview thumbnails */}
        <div className="flex items-center gap-1 ml-2">
          {images.slice(0, 4).map((img) => (
            <div
              key={img.id}
              className="w-5 h-5 rounded-sm overflow-hidden border border-white/[0.08] flex-shrink-0"
            >
              <img
                src={img.url}
                alt={img.caption || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
          {images.length > 4 && (
            <span className="text-[8px] font-mono text-t5">
              +{images.length - 4}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Expanded state, scrollable row
  return (
    <div className="border-b border-white/[0.06] bg-sf-surface/40">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-t3 hover:text-t1 transition-colors"
        >
          <ImageIcon className="w-3 h-3" />
          <span className="text-[9px] font-heading uppercase tracking-[1.5px]">
            Moodboard
          </span>
          <ChevronUp className="w-3 h-3" />
        </button>
        <span className="text-[8px] font-mono text-t5">
          {images.length} image{images.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Scrollable images */}
      <div className="flex gap-2 px-3 pb-2 overflow-x-auto sf-custom-scrollbar">
        {images.map((img) => (
          <div key={img.id} className="flex-shrink-0 group relative">
            <div className="w-[140px] h-[100px] rounded-sm overflow-hidden border border-white/[0.08] hover:border-white/[0.2] transition-colors">
              <img
                src={img.url}
                alt={img.caption || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {img.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] text-t3 line-clamp-1">
                  {img.caption}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

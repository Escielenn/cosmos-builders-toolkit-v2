import { ImageOff } from "lucide-react";

interface ScreenshotMockupProps {
  src: string;
  alt?: string;
  toolName?: string;
}

/**
 * Displays a tool screenshot or a placeholder if the image is not available.
 * Used in the Features page for tools without animated mockups.
 */
const ScreenshotMockup = ({ src, alt = "Tool preview", toolName }: ScreenshotMockupProps) => {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-sf-surface/50">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        onError={(e) => {
          // If image fails to load, show placeholder
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div class="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg class="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-muted-foreground">${toolName || "Tool"}</div>
                  <div class="text-xs text-muted-foreground/60 mt-1">Screenshot coming soon</div>
                </div>
              </div>
            `;
          }
        }}
      />
    </div>
  );
};

/**
 * Placeholder component shown when a screenshot is not yet available.
 */
export const ScreenshotPlaceholder = ({ toolName }: { toolName: string }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-sf-surface/50 rounded-lg border border-dashed border-muted/30">
      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
        <ImageOff className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <div className="text-sm text-muted-foreground">{toolName}</div>
        <div className="text-xs text-muted-foreground/60 mt-1">Screenshot coming soon</div>
      </div>
    </div>
  );
};

export default ScreenshotMockup;

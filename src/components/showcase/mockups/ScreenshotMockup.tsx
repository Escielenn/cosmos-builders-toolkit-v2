import { useState } from "react";
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
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return <ScreenshotPlaceholder toolName={toolName || "Tool"} />;
  }

  const webpSrc = src.replace(/\.png$/, ".webp");

  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-sf-surface/50">
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={src}
          alt={alt}
          loading="lazy"
          width={800}
          height={600}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      </picture>
    </div>
  );
};

/**
 * Placeholder component shown when a screenshot is not yet available.
 */
export const ScreenshotPlaceholder = ({ toolName }: { toolName: string }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-sf-surface/50 rounded-lg border border-dashed border-muted/30">
      <div className="w-12 h-12 rounded-sm bg-muted/50 flex items-center justify-center">
        <ImageOff className="w-6 h-6 text-t3" />
      </div>
      <div>
        <div className="text-sm text-t3">{toolName}</div>
        <div className="text-xs text-t3/60 mt-1">Screenshot coming soon</div>
      </div>
    </div>
  );
};

export default ScreenshotMockup;

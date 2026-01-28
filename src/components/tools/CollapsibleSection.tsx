import { useState } from "react";
import { ChevronUp, ChevronDown, Info } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CollapsibleSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  /** Numbered badge (1, 2, 3...) - mutually exclusive with icon */
  levelNumber?: number;
  /** Icon element - mutually exclusive with levelNumber */
  icon?: React.ReactNode;
  /** "Think like a..." prompt shown at top of content */
  thinkLike?: string;
  /** Guidance text shown in tooltip next to title */
  guidance?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Visual variant: 'default' wraps in GlassPanel, 'minimal' has no wrapper */
  variant?: "default" | "minimal";
  /** Hover effect color: 'primary' or 'accent' */
  hoverColor?: "primary" | "accent";
  /** Controlled open state - when provided, component becomes controlled */
  open?: boolean;
  /** Callback when open state changes (for controlled usage) */
  onOpenChange?: (open: boolean) => void;
}

const CollapsibleSection = ({
  id,
  title,
  subtitle,
  levelNumber,
  icon,
  thinkLike,
  guidance,
  children,
  defaultOpen = false,
  variant = "default",
  hoverColor = "primary",
  open: controlledOpen,
  onOpenChange,
}: CollapsibleSectionProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Support both controlled and uncontrolled usage
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const hoverClass = hoverColor === "primary"
    ? "hover:bg-primary/5"
    : "hover:bg-accent/20";

  const content = (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`w-full p-4 md:p-6 flex items-center justify-between text-left ${hoverClass} transition-colors ${variant === "default" ? "" : "rounded-lg"}`}
        >
          <div className="flex items-center gap-3">
            {/* Numbered badge */}
            {levelNumber !== undefined && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                {levelNumber}
              </div>
            )}
            {/* Icon */}
            {icon && !levelNumber && icon}
            {/* Title and subtitle */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-lg">{title}</h3>
                {guidance && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-sm">{guidance}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 md:px-6 pb-6 space-y-6">
          {thinkLike && (
            <p className="text-sm text-primary italic border-l-2 border-primary pl-3">
              Think like {thinkLike}
            </p>
          )}
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  if (variant === "minimal") {
    return (
      <div id={id} className="scroll-mt-24">
        {content}
      </div>
    );
  }

  return (
    <GlassPanel id={id} className="overflow-hidden scroll-mt-24">
      {content}
    </GlassPanel>
  );
};

export default CollapsibleSection;

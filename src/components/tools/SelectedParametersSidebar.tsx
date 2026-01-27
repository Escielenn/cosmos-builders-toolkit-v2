import { ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectedParameter {
  typeId: string;
  categoryLabel: string;
  optionLabel: string;
  optionDescription: string;
  specificValue: string;
}

interface SelectedParametersSidebarProps {
  parameters: SelectedParameter[];
  className?: string;
  title?: string;
  footerText?: string;
}

const SelectedParametersSidebar = ({
  parameters,
  className,
  title = "Selected Environmental Factors",
  footerText = "Reference these factors as you work through the cascade levels.",
}: SelectedParametersSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (parameters.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky top-24 transition-all duration-300",
        isCollapsed ? "w-10" : "w-72",
        className
      )}
    >
      <GlassPanel className="relative overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-2 right-2 z-10 w-6 h-6"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>

        {isCollapsed ? (
          <div className="p-2 pt-10">
            <div
              className="writing-mode-vertical text-xs text-muted-foreground font-medium"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              {parameters.length} Factor{parameters.length !== 1 ? "s" : ""} Selected
            </div>
          </div>
        ) : (
          <div className="p-4 pt-10">
            <h3 className="font-display font-semibold text-sm mb-3 text-primary">
              {title}
            </h3>
            <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
              {parameters.map((param) => (
                <div
                  key={param.typeId}
                  className="border-l-2 border-primary/50 pl-3 py-1"
                >
                  <div className="text-xs font-medium text-primary">
                    {param.categoryLabel}
                  </div>
                  <div className="text-sm font-medium">{param.optionLabel}</div>
                  {param.specificValue && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      "{param.specificValue}"
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
              {footerText}
            </p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

export default SelectedParametersSidebar;

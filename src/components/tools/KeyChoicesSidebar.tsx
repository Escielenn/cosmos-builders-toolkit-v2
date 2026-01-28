import { useState } from "react";
import { ClipboardList, ChevronRight, ChevronDown } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface KeyChoice {
  label: string;
  value: string | string[] | undefined;
  /** Optional: format array values as bullets instead of comma-separated */
  asList?: boolean;
}

export interface KeyChoicesSection {
  id: string;
  title: string;
  choices: KeyChoice[];
}

interface KeyChoicesSidebarProps {
  sections: KeyChoicesSection[];
  /** Title shown at top of sidebar */
  title?: string;
}

const KeyChoicesSidebar = ({
  sections,
  title = "Key Choices",
}: KeyChoicesSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatValue = (choice: KeyChoice): string | null => {
    if (!choice.value) return null;
    if (Array.isArray(choice.value)) {
      if (choice.value.length === 0) return null;
      return choice.asList
        ? choice.value.join("\n")
        : choice.value.join(", ");
    }
    return choice.value;
  };

  const hasAnyValue = (section: KeyChoicesSection): boolean => {
    return section.choices.some((c) => {
      if (!c.value) return false;
      if (Array.isArray(c.value)) return c.value.length > 0;
      return c.value.trim() !== "";
    });
  };

  const SidebarContent = () => (
    <>
      <h4 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-primary" />
        {title}
      </h4>
      <div className="space-y-2">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const hasValues = hasAnyValue(section);

          return (
            <Collapsible
              key={section.id}
              open={isExpanded}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-between w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors",
                    hasValues
                      ? "text-foreground hover:bg-muted/50"
                      : "text-muted-foreground/50 hover:bg-muted/30"
                  )}
                >
                  <span className="truncate">{section.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-2 pr-1 py-1 space-y-1.5">
                  {section.choices.map((choice, idx) => {
                    const value = formatValue(choice);
                    if (!value) return null;

                    return (
                      <div key={idx} className="text-xs">
                        <span className="text-muted-foreground">
                          {choice.label}:
                        </span>
                        {choice.asList && Array.isArray(choice.value) ? (
                          <ul className="mt-0.5 ml-2 space-y-0.5">
                            {choice.value.map((v, i) => (
                              <li
                                key={i}
                                className="text-foreground before:content-['•'] before:mr-1 before:text-primary"
                              >
                                {v}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="ml-1 text-foreground font-medium">
                            {value}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {!hasValues && (
                    <span className="text-xs text-muted-foreground/50 italic">
                      Not yet filled
                    </span>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop - Fixed sidebar (positioned below SectionNavigation) */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 hidden xl:block z-40 no-print">
        <GlassPanel className="p-3 max-h-[70vh] overflow-y-auto w-56">
          <SidebarContent />
        </GlassPanel>
      </div>

      {/* Mobile/Tablet - Floating button + Sheet */}
      <div className="fixed left-4 bottom-4 xl:hidden z-40 no-print">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-14 h-14 shadow-lg bg-background/80 backdrop-blur-sm"
            >
              <ClipboardList className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 bg-background/95 backdrop-blur-lg"
          >
            <div className="pt-6">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default KeyChoicesSidebar;

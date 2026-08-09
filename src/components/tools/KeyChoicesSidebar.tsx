import { useState } from "react";
import { ClipboardList, ChevronRight, ChevronDown } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { KeyValueRow } from "@/components/ui/key-value-row";
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
  /**
   * 'floating' (default): Fixed position with mobile sheet
   * 'inline': Returns just the panel for use inside ToolSidebar
   */
  mode?: 'floating' | 'inline';
}

const KeyChoicesSidebar = ({
  sections,
  title = "Key Choices",
  mode = 'floating',
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
      <h4 className="font-mono text-[11px] tracking-[2px] uppercase text-t3/60 mb-3 flex items-center gap-2">
        <ClipboardList className="w-3.5 h-3.5" />
        // READOUT
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
                    "flex items-center justify-between w-full text-left px-2 py-1.5 text-xs transition-colors font-heading tracking-wider uppercase",
                    hasValues
                      ? "text-t1 hover:bg-muted/50"
                      : "text-t3 hover:bg-muted/30"
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
                <div className="pl-2 pr-1 py-1 space-y-1">
                  {section.choices.map((choice, idx) => {
                    const value = formatValue(choice);
                    if (!value) return null;

                    // List-style values render as a bullet list; scalar values
                    // render as a telemetry KeyValueRow (mono label : mono value).
                    if (choice.asList && Array.isArray(choice.value)) {
                      return (
                        <div key={idx} className="text-[12px]">
                          <span className="font-mono text-t4 uppercase tracking-[0.12em]">
                            {choice.label.toUpperCase()}
                          </span>
                          <ul className="mt-1 ml-1 space-y-0.5">
                            {choice.value.map((v, i) => (
                              <li
                                key={i}
                                className="font-mono text-[12px] tabular-nums text-t1 before:content-['·'] before:mr-1.5 before:text-sf-amber-warm"
                              >
                                {v}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return (
                      <KeyValueRow
                        key={idx}
                        label={choice.label.toUpperCase()}
                        value={value}
                        accent="amber"
                      />
                    );
                  })}
                  {!hasValues && (
                    <span className="font-mono text-[12px] tracking-[0.18em] text-t5 uppercase">
                      // NO DATA ON FILE
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

  // Inline mode: return just the panel for use inside ToolSidebar
  if (mode === 'inline') {
    return (
      <GlassPanel className="p-3 max-h-[40vh] overflow-y-auto w-56 sf-bracketed--amber">
        <SidebarContent />
      </GlassPanel>
    );
  }

  // Floating mode: fixed position with mobile sheet
  return (
    <>
      {/* Desktop - Fixed sidebar (positioned below SectionNavigation) */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 hidden xl:block z-40 no-print">
        <GlassPanel className="p-3 max-h-[70vh] overflow-y-auto w-56 sf-bracketed--amber">
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
              className="rounded-none w-auto h-auto px-3 py-2.5 shadow-lg bg-background/80 backdrop-blur-sm"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              <span className="text-[12px] tracking-[1.5px] uppercase font-heading">READOUT</span>
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

/**
 * Mobile-only key choices trigger button with sheet.
 * Use this alongside KeyChoicesSidebar mode="inline" for mobile support.
 */
export const MobileKeyChoices = ({
  sections,
  title = "Key Choices",
}: {
  sections: KeyChoicesSection[];
  title?: string;
}) => {
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="rounded-none w-auto h-auto px-3 py-2.5 shadow-lg bg-background/80 backdrop-blur-sm"
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          <span className="text-[12px] tracking-[1.5px] uppercase font-heading">READOUT</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-lg">
        <div className="pt-6">
          <h4 className="font-mono text-[11px] tracking-[2px] uppercase text-t3/60 mb-3 flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5" />
            // READOUT
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
                        "flex items-center justify-between w-full text-left px-2 py-1.5 text-xs transition-colors font-heading tracking-wider uppercase",
                        hasValues
                          ? "text-t1 hover:bg-muted/50"
                          : "text-t3 hover:bg-muted/30"
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
                            <span className="sf-readout-label">
                              {choice.label}:
                            </span>
                            {choice.asList && Array.isArray(choice.value) ? (
                              <ul className="mt-0.5 ml-2 space-y-0.5">
                                {choice.value.map((v, i) => (
                                  <li
                                    key={i}
                                    className="sf-readout-value before:content-['•'] before:mr-1 before:text-[rgba(255,179,71,0.4)]"
                                  >
                                    {v}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="ml-1 sf-readout-value font-medium">
                                {value}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {!hasValues && (
                        <span className="text-xs text-t3 italic font-mono">
                          · NO DATA ·
                        </span>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KeyChoicesSidebar;

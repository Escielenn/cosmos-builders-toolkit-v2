import { useState, useEffect } from "react";
import { plainTitle } from "@/components/tools/KeyChoicesSidebar";
import { createPortal } from "react-dom";
import { ArrowUp, ArrowDown } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";
import { useRailSlot, useToolRail } from "@/components/tools/tool-rail";
import { useToolReadOnly } from "@/contexts/ToolPreviewContext";

export interface Section {
  id: string;
  title: string;
  level?: number; // 1 = main section, 2 = subsection
}

interface SectionNavigationProps {
  sections: Section[];
  /**
   * Kept for the call sites. Inside a ToolPageLayout both modes render into
   * the page's one right rail (the "Sections" tab); the prop only matters
   * outside one, where 'floating' is a fixed panel and 'inline' a plain one.
   */
  mode?: "floating" | "inline";
}

function useActiveSection(sections: Section[]): string {
  const [activeSection, setActiveSection] = useState<string>("");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) setActiveSection(visibleEntry.target.id);
      },
      { threshold: 0.2, rootMargin: "-100px 0px -50% 0px" },
    );
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [sections]);
  return activeSection;
}

/**
 * scrollIntoView rather than window.scrollTo: inside a world the page
 * scrolls in .sf-world-main, not the window, and every section already
 * carries scroll-mt-24 for the sticky chrome.
 */
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToEdge(edge: "top" | "bottom") {
  const main = document.getElementById("main");
  const target = main && main.scrollHeight > main.clientHeight ? main : null;
  const top = edge === "top" ? 0 : (target ?? document.documentElement).scrollHeight;
  (target ?? window).scrollTo({ top, behavior: "smooth" });
}

function SectionList({
  sections,
  activeSection,
  onNavigate,
  readOnly = false,
}: {
  sections: Section[];
  activeSection: string;
  onNavigate?: () => void;
  readOnly?: boolean;
}) {
  // Preview (ProToolGuard): the section list says what is inside; nothing jumps.
  if (readOnly) {
    return (
      <ol className="space-y-0.5" aria-label="Sections">
        {sections.map((section, idx) => (
          <li key={section.id} className={cn("sf-instrument-nav-item", section.level === 2 && "pl-6")}>
            <span className="sf-instrument-nav-number">{String(idx + 1).padStart(2, "0")}</span>
            {plainTitle(section.title)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <>
      <nav aria-label="Sections" className="space-y-0.5">
        {sections.map((section, idx) => (
          <button
            type="button"
            key={section.id}
            onClick={() => {
              scrollToId(section.id);
              onNavigate?.();
            }}
            data-active={activeSection === section.id}
            aria-current={activeSection === section.id ? "location" : undefined}
            className={cn("sf-instrument-nav-item block w-full text-left", section.level === 2 && "pl-6")}
          >
            <span className="sf-instrument-nav-number">{String(idx + 1).padStart(2, "0")}</span>
            {plainTitle(section.title)}
          </button>
        ))}
      </nav>
      <div className="mt-3 flex border-t border-sf-line-hairline pt-2">
        <button
          type="button"
          onClick={() => {
            scrollToEdge("top");
            onNavigate?.();
          }}
          className="flex min-h-hit flex-1 items-center justify-center gap-1.5 font-sans text-[12px] font-medium uppercase text-t3 transition-colors duration-base hover:text-t1"
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          Top
        </button>
        <button
          type="button"
          onClick={() => {
            scrollToEdge("bottom");
            onNavigate?.();
          }}
          className="flex min-h-hit flex-1 items-center justify-center gap-1.5 font-sans text-[12px] font-medium uppercase text-t3 transition-colors duration-base hover:text-t1"
        >
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          Bottom
        </button>
      </div>
    </>
  );
}

const SectionNavigation = ({ sections, mode = "floating" }: SectionNavigationProps) => {
  const activeSection = useActiveSection(sections);
  const rail = useToolRail();
  const node = useRailSlot("sections");
  const readOnly = useToolReadOnly();

  // Inside a tool page: the rail's Sections tab.
  if (rail) {
    return node
      ? createPortal(
          <SectionList sections={sections} activeSection={activeSection} onNavigate={rail.close} readOnly={readOnly} />,
          node,
        )
      : null;
  }

  const panel = (
    <GlassPanel className="p-4 max-h-[70vh] overflow-y-auto w-56 sf-sb">
      <h4 className="font-heading text-sf-eyebrow uppercase text-t4 mb-3 pb-2 border-b border-sf-line-hairline">
        Sections
      </h4>
      <SectionList sections={sections} activeSection={activeSection} readOnly={readOnly} />
    </GlassPanel>
  );

  if (mode === "inline") return panel;
  return <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden xl:block z-40 no-print">{panel}</div>;
};

export default SectionNavigation;

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, List } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export interface Section {
  id: string;
  title: string;
  level?: number; // 1 = main section, 2 = subsection
}

interface SectionNavigationProps {
  sections: Section[];
  /**
   * 'floating' (default): Fixed position with mobile sheet
   * 'inline': Returns just the panel for use inside ToolSidebar
   */
  mode?: 'floating' | 'inline';
}

const SectionNavigation = ({ sections, mode = 'floating' }: SectionNavigationProps) => {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible section
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      { threshold: 0.2, rootMargin: "-100px 0px -50% 0px" }
    );

    // Observe each section
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setIsOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsOpen(false);
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    setIsOpen(false);
  };

  const NavigationContent = () => (
    <>
      <h4 className="font-heading text-[12px] font-medium tracking-[0.2em] uppercase text-sf-teal/60 mb-3 pb-2 border-b border-sf-teal/[0.08]">
        <span className="font-mono text-sf-teal mr-1">//</span> NAVIGATION
      </h4>
      <nav className="space-y-0.5">
        {sections.map((section, idx) => {
          const num = String(idx + 1).padStart(2, "0");
          return (
            <button
              type="button"
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              data-active={activeSection === section.id}
              className={cn(
                "sf-instrument-nav-item block text-left w-full",
                section.level === 2 && "pl-6 text-[12px]",
              )}
            >
              <span className="sf-instrument-nav-number">{num}</span>
              {section.title}
            </button>
          );
        })}
      </nav>
      <div className="flex flex-col gap-2 mt-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={scrollToTop}
        >
          <ArrowUp className="w-4 h-4 mr-2" />
          Back to Top
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={scrollToBottom}
        >
          <ArrowDown className="w-4 h-4 mr-2" />
          Go to Bottom
        </Button>
      </div>
    </>
  );

  // Inline mode: return just the panel for use inside ToolSidebar
  if (mode === 'inline') {
    return (
      <GlassPanel className="p-4 max-h-[40vh] overflow-y-auto w-56">
        <NavigationContent />
      </GlassPanel>
    );
  }

  // Floating mode: fixed position with mobile sheet
  return (
    <>
      {/* Desktop Navigation - Fixed sidebar */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden xl:block z-50 no-print">
        <GlassPanel className="p-4 max-h-[70vh] overflow-y-auto w-52">
          <NavigationContent />
        </GlassPanel>
      </div>

      {/* Mobile/Tablet Navigation - Floating button + Sheet */}
      <div className="fixed right-4 bottom-4 xl:hidden z-50 no-print">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-none w-auto h-auto px-3 py-2.5 shadow-lg"
            >
              <List className="w-4 h-4 mr-2" />
              <span className="text-[12px] tracking-[1.5px] uppercase font-heading">NAV</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-sf-surface/95 backdrop-blur-sf-side border-sf-border sf-sb">
            <div className="pt-6">
              <NavigationContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

/**
 * Mobile-only section navigation trigger button with sheet.
 * Use this alongside SectionNavigation mode="inline" for mobile support.
 */
export const MobileSectionNav = ({ sections }: { sections: Section[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      { threshold: 0.2, rootMargin: "-100px 0px -50% 0px" }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsOpen(false);
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="lg" className="rounded-none w-auto h-auto px-3 py-2.5 shadow-lg">
          <List className="w-4 h-4 mr-2" />
          <span className="text-[12px] tracking-[1.5px] uppercase font-heading">NAV</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-lg">
        <div className="pt-6">
          <h4 className="font-heading text-[12px] font-light tracking-[2.5px] uppercase text-emerald/40 mb-3 pb-2 border-b border-emerald/[0.06]">
            // NAVIGATION
          </h4>
          <nav className="space-y-0.5">
            {sections.map((section, idx) => {
              const num = String(idx + 1).padStart(2, "0");
              return (
                <button
                  type="button"
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  data-active={activeSection === section.id}
                  className={cn(
                    "sf-instrument-nav-item block text-left w-full",
                    section.level === 2 && "pl-6 text-[12px]",
                  )}
                >
                  <span className="sf-instrument-nav-number">{num}</span>
                  {section.title}
                </button>
              );
            })}
          </nav>
          <div className="flex flex-col gap-2 mt-4">
            <Button variant="ghost" size="sm" className="w-full" onClick={scrollToTop}>
              <ArrowUp className="w-4 h-4 mr-2" />
              Back to Top
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={scrollToBottom}>
              <ArrowDown className="w-4 h-4 mr-2" />
              Go to Bottom
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SectionNavigation;

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
}

const SectionNavigation = ({ sections }: SectionNavigationProps) => {
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
      <h4 className="font-semibold text-sm mb-3 text-foreground">Sections</h4>
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            type="button"
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "block text-sm text-left w-full px-2 py-1.5 rounded transition-colors",
              section.level === 2 && "pl-4 text-xs",
              activeSection === section.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {section.title}
          </button>
        ))}
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
              className="rounded-full w-14 h-14 shadow-lg"
            >
              <List className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-lg">
            <div className="pt-6">
              <NavigationContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default SectionNavigation;

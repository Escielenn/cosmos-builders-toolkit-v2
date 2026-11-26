import { ReactNode } from "react";
import { useToolRail } from "@/components/tools/tool-rail";

interface ToolSidebarProps {
  children: ReactNode;
}

/**
 * Groups a tool page's rail content. Inside a ToolPageLayout the children
 * (SectionNavigation, KeyChoicesSidebar, RailReadout) portal themselves into
 * the page's one right rail, so this renders nothing of its own. Every child
 * must be one of those three; anything else would land in the page flow.
 *
 * Outside a ToolPageLayout it keeps the legacy fixed right column.
 */
const ToolSidebar = ({ children }: ToolSidebarProps) => {
  const rail = useToolRail();
  if (rail) return <>{children}</>;
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-40 no-print max-h-[85vh] overflow-y-auto sf-sb">
      {children}
    </div>
  );
};

export default ToolSidebar;

import { ReactNode } from "react";

interface ToolSidebarProps {
  children: ReactNode;
}

/**
 * Container component for tool page sidebars.
 * Renders children in a fixed right-side column on desktop (xl+).
 * On smaller screens, children should render their own mobile UI (sheets/buttons).
 */
const ToolSidebar = ({ children }: ToolSidebarProps) => {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-40 no-print max-h-[85vh] overflow-y-auto">
      {children}
    </div>
  );
};

export default ToolSidebar;

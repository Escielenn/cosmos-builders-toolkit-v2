import { useIsWorldLayout } from "@/contexts/WorldLayoutContext";
import Header from "./Header";
import Footer from "./Footer";

interface PageShellProps {
  children: React.ReactNode;
  /** Extra className for the standalone outer wrapper */
  className?: string;
}

/**
 * Wraps tool/page content. Adapts based on context:
 * - Inside WorldLayout: renders content only (no Header/Footer)
 * - Standalone: renders with Header + Footer + full-page wrapper
 */
const PageShell = ({ children, className = "" }: PageShellProps) => {
  const isWorldLayout = useIsWorldLayout();

  if (isWorldLayout) {
    return (
      <div className={`sf-tool-content ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default PageShell;

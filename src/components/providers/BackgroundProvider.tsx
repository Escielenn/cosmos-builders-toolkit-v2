import { useEffect } from "react";
import { useBackground } from "@/hooks/use-background";

/**
 * BackgroundProvider - Applies the selected background globally
 * This component should be placed high in the component tree (in App.tsx)
 * so the background works on all pages without each page needing to call useBackground()
 */
export const BackgroundProvider = ({ children }: { children: React.ReactNode }) => {
  // This hook call applies the background to document.body
  useBackground();

  return <>{children}</>;
};

export default BackgroundProvider;

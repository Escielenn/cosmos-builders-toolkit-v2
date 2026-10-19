import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageContainer: the ONE content frame (docs/stellarforge/15-PAGE-CHROME.md).
 *
 *   standalone  max 1200px, centred, 24px gutters (16px on phones), clears the
 *               fixed site header (pt-24).
 *   space       inside WorldLayout: full width of the world's main column,
 *               same gutters, no header offset (WorldLayout already clears it).
 *   wide        standalone at 1440px for dense grids (tool catalog, community).
 *
 * Every page's left edge lines up because every page uses this.
 */
export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "standalone" | "space" | "wide";
}

const VARIANT: Record<NonNullable<PageContainerProps["variant"]>, string> = {
  standalone: "mx-auto w-full max-w-[1200px] px-4 pb-16 pt-24 sm:px-6",
  wide: "mx-auto w-full max-w-[1440px] px-4 pb-16 pt-24 sm:px-6",
  space: "w-full px-4 pb-16 pt-8 sm:px-6",
};

export function PageContainer({ variant = "standalone", className, ...rest }: PageContainerProps): JSX.Element {
  return <div className={cn(VARIANT[variant], className)} data-page-container={variant} {...rest} />;
}

export default PageContainer;

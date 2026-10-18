import type { HTMLAttributes } from "react";
import { useIsWorldLayout } from "@/contexts/WorldLayoutContext";
import { MAIN_LANDMARK_ID } from "./SkipLink";

/**
 * A page's `<main>` landmark, id'd for the skip link. Inside WorldLayout the
 * layout already owns `<main id="main">`, so this renders a plain `<div>`
 * there: one main landmark per page, never nested.
 */
export function MainLandmark({ children, ...rest }: HTMLAttributes<HTMLElement>): JSX.Element {
  const inWorldLayout = useIsWorldLayout();
  if (inWorldLayout) return <div {...rest}>{children}</div>;
  return (
    <main id={MAIN_LANDMARK_ID} tabIndex={-1} {...rest}>
      {children}
    </main>
  );
}

export default MainLandmark;

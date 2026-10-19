import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { useMetaTags } from "@/hooks/use-meta-tags";

/**
 * SimulatorSciencePage: the one frame for a simulator's Science page
 * (docs/stellarforge/15-PAGE-CHROME.md). A Science page is a standalone child
 * of its simulator, so it gets PageContainer + PageHeader with one back link
 * ("Back to Rogue"), then the static explainer document in an iframe.
 *
 * The document hides its own title block when framed
 * (public/tools/_shared/science-embed.js), and the frame grows to the
 * document's height so the page scrolls once.
 */
export interface SimulatorSciencePageProps {
  /** Display name, as the simulator names itself ("Rogue", "ExoForge"). */
  name: string;
  /** Route of the simulator this page explains. */
  simulatorPath: string;
  /** Static explainer document. */
  src: string;
}

/** Fallback frame height until the document reports its own. */
const INITIAL_HEIGHT = 1200;

export function SimulatorSciencePage({ name, simulatorPath, src }: SimulatorSciencePageProps): JSX.Element {
  useMetaTags({ title: `${name}: The Science` });
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(INITIAL_HEIGHT);
  const observerRef = useRef<ResizeObserver | null>(null);

  const measure = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.documentElement) return;
    const next = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
    if (next > 0) setHeight(next);
  }, []);

  const onLoad = useCallback(() => {
    measure();
    observerRef.current?.disconnect();
    const body = frameRef.current?.contentDocument?.body;
    if (body && typeof ResizeObserver !== "undefined") {
      observerRef.current = new ResizeObserver(measure);
      observerRef.current.observe(body);
    }
  }, [measure]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <PageContainer>
          <PageHeader
            back={{ label: `Back to ${name}`, to: simulatorPath }}
            eyebrow="THE SCIENCE"
            title="Showing our work"
            lede={`The physics and data behind ${name}: every model, constant and source the simulator runs on.`}
          />
          <iframe
            ref={frameRef}
            src={src}
            title={`${name}, The Science`}
            onLoad={onLoad}
            className="block w-full border-0"
            style={{ height }}
          />
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}

export default SimulatorSciencePage;

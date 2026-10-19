import { ReactNode } from "react";
import { Calendar } from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { PageBursts } from "@/components/ui/data-burst";
import type { DataBurstConfig } from "@/lib/data-bursts";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";

/**
 * Legal and reference documents (Privacy, Terms, Credits, Changelog).
 * Page chrome per docs/stellarforge/15-PAGE-CHROME.md: PageContainer +
 * PageHeader, no "RETURN HOME" (the logo goes home). These pages have no
 * parent route, so they take a back link only when a caller names one.
 */
interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  /** @deprecated The eyebrow is text-only (`// LABEL`); the icon is no longer drawn. */
  badgeIcon?: ReactNode;
  /** Eyebrow label, e.g. "Privacy". */
  badgeText: string;
  /** Optional back link to a real parent page. */
  back?: { label: string; to: string };
  content?: string;
  children?: ReactNode;
  bursts?: DataBurstConfig[];
}

// Markdown components. Section headings follow 15-PAGE-CHROME §4: h2 is a
// named block in display h3; sub-headings step down in DM Sans, sentence
// case as written (no forced uppercase).
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="font-display text-sf-h3 font-light text-t1 mt-12 mb-6 pt-8 border-t border-sf-line-hairline first:mt-0 first:pt-0 first:border-t-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-sans text-sf-body font-medium text-t1 mt-8 mb-4">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-sans text-sf-small font-medium text-t2 mt-6 mb-3">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="sf-measure text-t2 leading-relaxed my-4">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 space-y-2 pl-0">
      {children}
    </ul>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-3 text-t2">
      <span className="mt-2 w-1.5 h-1.5 bg-sf-primary/70 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="text-t1 font-medium">
      {children}
    </strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-sf-primary-text hover:text-sf-primary-bright transition-colors duration-base sf-text-link"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-sf-line-emphasis to-transparent" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 pl-4 border-l-2 border-sf-primary bg-sf-primary/[0.04] py-4 pr-4 italic text-t3">
      {children}
    </blockquote>
  ),
};

const LegalPageLayout = ({
  title,
  subtitle,
  lastUpdated,
  badgeText,
  back,
  content,
  children,
  bursts,
}: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main id="main" tabIndex={-1} className="relative">
        <PageContainer variant="standalone">
        {bursts && <PageBursts bursts={bursts} />}
        <PageHeader
          size="page"
          back={back}
          eyebrow={badgeText}
          title={title}
          lede={subtitle}
        >
          <div className="flex items-center gap-2 font-mono text-sf-mono uppercase text-t4">
            <Calendar className="w-4 h-4" aria-hidden />
            Last updated · {lastUpdated}
          </div>
        </PageHeader>

        {/* Content: a reading column, left-aligned on the shared edge. */}
        <GlassPanel className="max-w-4xl p-6 md:p-10">
          <article className="max-w-none">
            {content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            ) : (
              children
            )}
          </article>
        </GlassPanel>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPageLayout;

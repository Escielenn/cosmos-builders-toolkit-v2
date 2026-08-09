import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { PageBursts } from "@/components/ui/data-burst";
import type { DataBurstConfig } from "@/lib/data-bursts";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  badgeIcon?: ReactNode;
  badgeText: string;
  content?: string;
  children?: ReactNode;
  bursts?: DataBurstConfig[];
}

// Custom markdown components, April 2026 handoff: mono eyebrows, t-tier text, zero radius.
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="flex items-center gap-3 font-heading text-2xl font-light uppercase tracking-[0.08em] text-t1 mt-12 mb-6 pt-8 border-t border-sf-border first:mt-0 first:pt-0 first:border-t-0">
      <span className="w-1 h-8 bg-sf-teal" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-heading text-lg font-medium uppercase tracking-[0.12em] text-t1 mt-8 mb-4 pl-4 border-l-2 border-sf-teal/40">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-heading text-base font-medium uppercase tracking-[0.1em] text-t2 mt-6 mb-3">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-t2 leading-relaxed my-4">
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
      <span className="mt-2 w-1.5 h-1.5 bg-sf-teal/70 flex-shrink-0" />
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
      className="text-sf-teal hover:text-sf-teal-bright transition-colors duration-base sf-text-link"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-sf-border-strong to-transparent" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 pl-4 border-l-2 border-sf-teal/40 bg-sf-teal/[0.04] py-4 pr-4 italic text-t3">
      {children}
    </blockquote>
  ),
};

const LegalPageLayout = ({
  title,
  subtitle,
  lastUpdated,
  badgeIcon,
  badgeText,
  content,
  children,
  bursts,
}: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        {bursts && <PageBursts bursts={bursts} />}
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-heading text-[12px] uppercase tracking-[0.2em] font-medium text-t3 hover:text-sf-teal-bright transition-colors duration-base mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          ← RETURN TO BRIDGE
        </Link>

        {/* Header */}
        <header className="mb-8">
          <p className="font-mono text-[12px] tracking-[0.18em] text-sf-teal uppercase mb-4 flex items-center gap-2">
            <span>//</span>
            {badgeIcon}
            {badgeText}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-light tracking-sf-title mb-4 text-t1 uppercase">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-t3 mb-4">{subtitle}</p>
          )}
          <div className="flex items-center gap-2 font-mono text-[12px] tracking-[0.18em] uppercase text-t4">
            <Calendar className="w-3 h-3" />
            LAST UPDATED · {lastUpdated}
          </div>
        </header>

        {/* Content */}
        <GlassPanel className="p-6 md:p-10">
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
      </main>

      <Footer />
    </div>
  );
};

export default LegalPageLayout;

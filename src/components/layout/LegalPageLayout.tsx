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

// Custom markdown components for better styling
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="flex items-center gap-3 text-2xl font-heading font-light tracking-[0.08em] text-foreground mt-12 mb-6 pt-8 border-t border-border/30 first:mt-0 first:pt-0 first:border-t-0">
      <span className="w-1 h-8 bg-primary rounded-full" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-heading font-semibold text-foreground/90 mt-8 mb-4 pl-4 border-l-2 border-primary/30">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-foreground/80 mt-6 mb-3">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-muted-foreground leading-relaxed my-4">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 space-y-2 pl-0">
      {children}
    </ul>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-3 text-muted-foreground">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="text-foreground font-semibold">
      {children}
    </strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary sf-text-link"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 pl-4 border-l-4 border-primary/40 bg-primary/5 py-4 pr-4 rounded-r-lg italic text-muted-foreground">
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
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <header className="mb-8">
          <Badge variant="secondary" className="mb-4">
            {badgeIcon}
            {badgeText}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground mb-4">{subtitle}</p>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Last updated: {lastUpdated}
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

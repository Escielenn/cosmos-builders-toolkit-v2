import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  badgeIcon?: ReactNode;
  badgeText: string;
  content?: string;
  children?: ReactNode;
}

const LegalPageLayout = ({
  title,
  subtitle,
  lastUpdated,
  badgeIcon,
  badgeText,
  content,
  children,
}: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
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
          <article className="prose prose-invert prose-lg max-w-none
            prose-headings:font-display prose-headings:font-semibold prose-headings:text-foreground
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pt-8 prose-h2:border-t prose-h2:border-border/30
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-foreground/90
            prose-h4:text-base prose-h4:mt-6 prose-h4:mb-3 prose-h4:text-foreground/80
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-4
            prose-li:text-muted-foreground prose-li:my-1
            prose-ul:my-4 prose-ul:space-y-1 prose-ol:my-4
            prose-strong:text-foreground prose-strong:font-semibold
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-hr:my-10 prose-hr:border-border/40
            first:prose-h2:mt-0 first:prose-h2:pt-0 first:prose-h2:border-t-0">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
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

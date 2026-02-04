import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
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
  children: ReactNode;
}

const LegalPageLayout = ({
  title,
  subtitle,
  lastUpdated,
  badgeIcon,
  badgeText,
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
          <article className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
            {children}
          </article>
        </GlassPanel>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPageLayout;

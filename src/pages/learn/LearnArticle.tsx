import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { useBackground } from "@/hooks/use-background";

// Temporary: Import MDX content directly
// Once Keystatic is fully set up, this will read from the content directory
import DrakeEquationContent from "@/content/learn/drake-equation/content.mdx";

// Article metadata (will come from Keystatic)
const articleMeta: Record<string, {
  title: string;
  description: string;
  category: string;
  publishedDate: string;
  content: React.ComponentType;
}> = {
  "drake-equation": {
    title: "The Drake Equation: A Worldbuilder's Tool",
    description: "How the famous equation for estimating extraterrestrial civilizations can help you design believable alien worlds and galactic settings.",
    category: "science",
    publishedDate: "2026-01-22",
    content: DrakeEquationContent,
  },
};

const categoryLabels: Record<string, string> = {
  basics: "Worldbuilding Basics",
  science: "Science Concepts",
  craft: "Writing Craft",
  "case-studies": "Case Studies",
};

const categoryColors: Record<string, string> = {
  basics: "bg-blue-500/20 text-blue-400",
  science: "bg-green-500/20 text-green-400",
  craft: "bg-purple-500/20 text-purple-400",
  "case-studies": "bg-amber-500/20 text-amber-400",
};

const LearnArticle = () => {
  useBackground();
  const { slug } = useParams<{ slug: string }>();

  const article = slug ? articleMeta[slug] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learn
          </Link>
          <GlassPanel className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
            <p className="text-muted-foreground">
              This article doesn't exist or hasn't been published yet.
            </p>
          </GlassPanel>
        </main>
      </div>
    );
  }

  const Content = article.content;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        {/* Back Link */}
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learn
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <Badge className={categoryColors[article.category]}>
            {categoryLabels[article.category]}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-4">
            {article.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            {article.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(article.publishedDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Article Content */}
        <GlassPanel className="p-6 md:p-10">
          <article className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary prose-blockquote:not-italic prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            <Content />
          </article>
        </GlassPanel>

        {/* Back to Learn */}
        <div className="mt-8 text-center">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all articles
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StellarForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LearnArticle;

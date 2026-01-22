import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Calendar } from "lucide-react";
import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { useBackground } from "@/hooks/use-background";

// This will be populated from Keystatic content
// For now, we'll use static data that matches the Keystatic schema
const articles = [
  {
    slug: "drake-equation",
    title: "The Drake Equation: A Worldbuilder's Tool",
    description: "How the famous equation for estimating extraterrestrial civilizations can help you design believable alien worlds and galactic settings.",
    category: "science",
    publishedDate: "2026-01-22",
    featured: true,
  },
  {
    slug: "worldbuilding-basics",
    title: "Worldbuilding From the Ground Up",
    description: "Start with physics, end with mythology. A systematic approach to creating consistent fictional worlds.",
    category: "basics",
    publishedDate: "2026-01-20",
    featured: true,
  },
  {
    slug: "cascade-consequences",
    title: "The Cascade of Consequences",
    description: "Why one environmental choice leads to a thousand cultural outcomes—and how to trace those connections.",
    category: "craft",
    publishedDate: "2026-01-18",
    featured: false,
  },
];

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

const LearnIndex = () => {
  useBackground();

  const featuredArticles = articles.filter((a) => a.featured);
  const recentArticles = articles.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Learn</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deep dives into worldbuilding concepts, science for storytellers, and the craft of creating believable fictional universes.
          </p>
        </section>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-6">Featured</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredArticles.map((article) => (
                <Link key={article.slug} to={`/learn/${article.slug}`}>
                  <GlassPanel
                    glow
                    className="p-6 h-full hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <Badge className={categoryColors[article.category]}>
                      {categoryLabels[article.category]}
                    </Badge>
                    <h3 className="font-display text-xl font-semibold mt-3 mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.publishedDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-primary text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </GlassPanel>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Articles */}
        <section>
          <h2 className="font-display text-2xl font-semibold mb-6">All Articles</h2>
          <div className="space-y-4">
            {articles.map((article) => (
              <Link key={article.slug} to={`/learn/${article.slug}`}>
                <GlassPanel className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={categoryColors[article.category]}>
                          {categoryLabels[article.category]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(article.publishedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {article.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2026 Jason D. Batt, Ph.D. •{" "}
            <a
              href="https://jbatt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              jbatt.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LearnIndex;

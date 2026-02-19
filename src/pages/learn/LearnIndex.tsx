import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Calendar, Loader2, Search, Beaker } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useArticles, useSearchArticles } from "@/hooks/use-sanity-articles";
import { urlFor } from "@/lib/sanity/client";

// Fallback static articles (shown when Sanity has no content yet)
const fallbackArticles = [
  {
    _id: "fallback-drake",
    slug: "drake-equation",
    title: "The Drake Equation: A Worldbuilder's Tool",
    description:
      "How the famous equation for estimating extraterrestrial civilizations can help you design believable alien worlds and galactic settings.",
    category: "science",
    publishedDate: "2026-01-22",
    featured: true,
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
  const [searchTerm, setSearchTerm] = useState("");
  const { data: sanityArticles, isLoading, error } = useArticles();
  const { data: searchResults, isLoading: isSearching } = useSearchArticles(searchTerm);
  const isSearchActive = searchTerm.length >= 2;

  // Use Sanity articles if available, otherwise fall back to static
  const articles =
    sanityArticles && sanityArticles.length > 0
      ? sanityArticles
      : fallbackArticles;

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
          <p className="text-sm font-medium uppercase tracking-sf-wide text-muted-foreground mb-2">Learn</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">SF University</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deep dives into worldbuilding concepts, science for storytellers,
            and the craft of creating believable fictional universes.
          </p>
        </section>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <GlassPanel className="p-4 mb-8 border-amber-500/50">
            <p className="text-amber-400 text-sm">
              Unable to load articles from CMS. Showing cached content.
            </p>
          </GlassPanel>
        )}

        {/* Search Results */}
        {isSearchActive && !isLoading && (
          <section>
            {isSearching && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            {!isSearching && searchResults && searchResults.length > 0 && (
              <>
                <h2 className="font-heading text-2xl font-semibold mb-6">
                  Results for &ldquo;{searchTerm}&rdquo;
                </h2>
                <div className="space-y-4">
                  {searchResults.map((article) => (
                    <Link key={article._id} to={`/learn/${article.slug}`}>
                      <GlassPanel className="p-4 hover:bg-accent/50 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="outline"
                                className={categoryColors[article.category]}
                              >
                                {categoryLabels[article.category]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(article.publishedDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" }
                                )}
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
              </>
            )}
            {!isSearching && searchResults && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No articles found for &ldquo;{searchTerm}&rdquo;
              </p>
            )}
          </section>
        )}

        {/* Featured Articles */}
        {!isLoading && !isSearchActive && featuredArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-semibold mb-6">
              Featured
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredArticles.map((article) => (
                <Link key={article._id} to={`/learn/${article.slug}`}>
                  <GlassPanel
                    glow
                    className="overflow-hidden h-full hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    {article.featuredImage?.asset && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={urlFor(article.featuredImage).width(600).height(340).url()}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <Badge className={categoryColors[article.category]}>
                        {categoryLabels[article.category]}
                      </Badge>
                      <h3 className="font-heading text-xl font-semibold mt-3 mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.publishedDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span className="text-primary text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read more <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </GlassPanel>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Simulator Science */}
        {!isLoading && !isSearchActive && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Beaker className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-heading text-2xl font-semibold">
                Simulator Science: Showing Our Work
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Link to="/rogue/science">
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20 overflow-hidden">
                      <img src="/icons/035-black hole.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    ROGUE: The Science
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The real astrophysics behind gravitational encounters, rogue planets, and N-body dynamics.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/tidelock/science">
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20 overflow-hidden">
                      <img src="/icons/044-day and night.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    TIDELOCK: The Science
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The science of tidally locked worlds, atmospheric circulation, and habitability around red dwarf stars.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/exosky/science">
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 overflow-hidden">
                      <img src="/icons/016-constellation.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    EXOSKY: The Science
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    How real stellar catalogs, parallax, and coordinate transforms create accurate alien night skies.
                  </p>
                </GlassPanel>
              </Link>
            </div>
          </section>
        )}

        {/* All Articles */}
        {!isLoading && !isSearchActive && (
          <section>
            <h2 className="font-heading text-2xl font-semibold mb-6">
              All Articles
            </h2>
            <div className="space-y-6">
              {articles.map((article) => (
                <Link key={article._id} to={`/learn/${article.slug}`} className="block">
                  <GlassPanel className="p-0 overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer group">
                    <div className="flex items-stretch gap-0">
                      {article.featuredImage?.asset ? (
                        <div className="w-32 md:w-48 shrink-0">
                          <img
                            src={urlFor(article.featuredImage).width(192).height(128).url()}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 md:w-48 shrink-0 bg-muted/30 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 p-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={categoryColors[article.category]}
                            >
                              {categoryLabels[article.category]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(article.publishedDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {article.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                      </div>
                    </div>
                  </GlassPanel>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LearnIndex;

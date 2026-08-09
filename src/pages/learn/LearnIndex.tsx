import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Calendar, Search, Beaker, GraduationCap, ExternalLink, Zap, Sparkles } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { SectionHero } from "@/components/ui/section-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useArticles, useSearchArticles } from "@/hooks/use-sanity-articles";
import { useFeaturedCourses } from "@/hooks/use-courses";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { urlFor } from "@/lib/sanity/client";
import { PageBursts } from "@/components/ui/data-burst";
import { LEARN_INDEX_BURSTS } from "@/lib/data-bursts";
import { GuideNav } from "@/components/layout/GuideNav";
import type { CourseListItem } from "@/lib/sanity/types";

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
  "case-studies": "bg-amber-500/20 text-sf-amber",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  upcoming: { label: "UPCOMING", className: "bg-white/5 border-white/10 text-t3" },
  enrolling: { label: "ENROLLING NOW", className: "bg-emerald-500/6 border-emerald-500/15 text-sf-emerald" },
  in_progress: { label: "IN SESSION", className: "bg-amber-500/6 border-amber-500/15 text-sf-amber" },
};

function CourseDiscountBadge({ course, courseDiscount, tier }: { course: CourseListItem; courseDiscount: string; tier: string }) {
  // Determine which discount string to show based on user's tier/plan
  if (tier === "free" || courseDiscount === "0%") {
    // Show generic "Members save" message
    const maxDiscount = course.vanguardYearlyDiscount || "25%";
    return (
      <span className="text-xs text-sf-violet">Members save up to {maxDiscount}</span>
    );
  }

  return (
    <Badge className="bg-violet-500/6 border border-violet-500/15 text-sf-violet text-xs">
      {courseDiscount} off
    </Badge>
  );
}

const LearnIndex = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: sanityArticles, isLoading, error } = useArticles();
  const { data: searchResults, isLoading: isSearching } = useSearchArticles(searchTerm);
  const { data: featuredCourses = [] } = useFeaturedCourses();
  const { user } = useAuth();
  const { tier, courseDiscount } = useSubscription();
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

      <main className="relative container mx-auto px-4 pt-24 pb-16">
        <PageBursts bursts={LEARN_INDEX_BURSTS} />
        {/* Hero Section */}
        <section className="mb-12">
          <SectionHero
            eyebrow="// ARCHIVE"
            title={<>SF <span className="text-sf-teal">university.</span></>}
            subtitle="Deep dives into worldbuilding concepts, science for storytellers, and the craft of creating believable fictional universes."
          />
        </section>

        {/* Cross-section navigation */}
        <GuideNav />

        {/* Page-specific shortcuts */}
        <div className="flex justify-center gap-2 -mt-4 mb-8">
          <a
            href="#courses"
            className="px-4 py-2 text-xs uppercase tracking-wider text-t3 hover:text-primary border border-sf-border rounded-md hover:border-primary/30 transition-all"
          >
            Courses
          </a>
          <Link
            to="/roadmap"
            className="px-4 py-2 text-xs uppercase tracking-wider text-t3 hover:text-primary border border-sf-border rounded-md hover:border-primary/30 transition-all"
          >
            Roadmap
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" />
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
            <Loader />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <GlassPanel className="p-4 mb-8 border-amber-500/50">
            <p className="text-sf-amber text-sm">
              Unable to load articles from CMS. Showing cached content.
            </p>
          </GlassPanel>
        )}

        {/* Search Results */}
        {isSearchActive && !isLoading && (
          <section>
            {isSearching && (
              <div className="flex justify-center py-8">
                <Loader size="sm" />
              </div>
            )}
            {!isSearching && searchResults && searchResults.length > 0 && (
              <>
                <h2 className="font-heading text-2xl font-light uppercase tracking-[2px] mb-6">
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
                              <span className="text-xs text-t3">
                                {new Date(article.publishedDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" }
                                )}
                              </span>
                            </div>
                            <h3 className="font-medium group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-sm text-t3 mt-1">
                              {article.description}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-t3 group-hover:text-primary transition-colors shrink-0 mt-1" />
                        </div>
                      </GlassPanel>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {!isSearching && searchResults && searchResults.length === 0 && (
              <p className="text-center text-t3 py-8">
                No articles found for &ldquo;{searchTerm}&rdquo;
              </p>
            )}
          </section>
        )}

        {/* Featured Articles */}
        {!isLoading && !isSearchActive && featuredArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-light uppercase tracking-[2px] mb-6">
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
                      <h3 className="font-heading text-xl font-medium mt-3 mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-t3 text-sm mb-4">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-t3 flex items-center gap-1">
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
              <Beaker className="w-5 h-5 text-t3" />
              <h2 className="font-heading text-2xl font-light uppercase tracking-[2px]">
                Simulator Science: Showing Our Work
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Link to="/rogue/science">
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20 overflow-hidden">
                      <img src="/icons/035-black hole.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    ROGUE: The Science
                  </h3>
                  <p className="text-sm text-t3 mt-1">
                    The real astrophysics behind gravitational encounters, rogue planets, and N-body dynamics.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/tidelock/science">
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20 overflow-hidden">
                      <img src="/icons/044-day and night.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    TIDELOCK: The Science
                  </h3>
                  <p className="text-sm text-t3 mt-1">
                    The science of tidally locked worlds, atmospheric circulation, and habitability around red dwarf stars.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/exosky/science">
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 overflow-hidden">
                      <img src="/icons/016-constellation.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    EXOSKY: The Science
                  </h3>
                  <p className="text-sm text-t3 mt-1">
                    How real stellar catalogs, parallax, and coordinate transforms create accurate alien night skies.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/exoforge/science">
                <GlassPanel className="p-5 h-full hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 overflow-hidden">
                      <img src="/icons/025-planet-earth.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    EXOFORGE: The Science
                  </h3>
                  <p className="text-sm text-t3 mt-1">
                    Terrain generation, composition spectra, biome models, and the physics behind procedural exoplanet forging.
                  </p>
                </GlassPanel>
              </Link>
            </div>
          </section>
        )}

        {/* Courses */}
        {!isLoading && !isSearchActive && featuredCourses.length > 0 && (
          <section id="courses" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="w-5 h-5 text-sf-violet" />
              <h2 className="font-heading text-2xl font-light uppercase tracking-[2px]">
                Courses
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredCourses.map((course) => {
                const statusCfg = STATUS_LABELS[course.status] || STATUS_LABELS.upcoming;
                return (
                  <GlassPanel key={course._id} className="overflow-hidden group">
                    {course.artwork?.asset && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={urlFor(course.artwork).width(600).height(340).url()}
                          alt={course.artwork.alt || course.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      {/* Status + category */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className={`${statusCfg.className} border`}>
                          {statusCfg.label}
                        </Badge>
                        {course.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-t3 border-white/10">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Title */}
                      <h3 className="font-heading text-lg font-light uppercase tracking-[2px] text-t1 mb-2">
                        {course.title}
                      </h3>

                      {/* Instructor + dates */}
                      <div className="flex items-center gap-3 text-xs text-t3 mb-3">
                        <span>Instructor: <span className="text-t2">{course.instructor}</span></span>
                        {course.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(course.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {course.duration && (
                          <span>{course.duration}</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-t2 mb-4 leading-relaxed line-clamp-3">
                        {course.description}
                      </p>

                      {/* Price + discount + register */}
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-t1">{course.price}</span>
                          <CourseDiscountBadge
                            course={course}
                            courseDiscount={courseDiscount}
                            tier={tier}
                          />
                        </div>
                        <Button
                          asChild
                          size="sm"
                          className="gap-1.5"
                        >
                          <a
                            href={course.registrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            REGISTER
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>

            {/* Discount upsell for non-subscribed users */}
            {!user && (
              <GlassPanel className="p-4 mt-4 border-violet-500/10 text-center">
                <p className="text-sm text-t3">
                  <Zap className="w-3.5 h-3.5 inline-block mr-1 text-sf-amber -mt-0.5" />
                  Pro members save 5–10% on all courses.{" "}
                  <Sparkles className="w-3.5 h-3.5 inline-block mr-1 text-sf-violet -mt-0.5" />
                  Vanguard members save up to 25%.{" "}
                  <Link to="/pricing" className="text-primary hover:underline">
                    View plans
                  </Link>
                </p>
              </GlassPanel>
            )}
          </section>
        )}

        {/* All Articles */}
        {!isLoading && !isSearchActive && (
          <section>
            <h2 className="font-heading text-2xl font-light uppercase tracking-[2px] mb-6">
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
                          <BookOpen className="w-8 h-8 text-t3/30" />
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
                            <span className="text-xs text-t3">
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
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-t3 mt-1 line-clamp-2">
                            {article.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-t3 group-hover:text-primary transition-colors shrink-0 mt-1" />
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

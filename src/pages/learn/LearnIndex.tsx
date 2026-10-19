import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Calendar, Search, Beaker, GraduationCap, ExternalLink, Zap, Sparkles } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Notice, PageContainer, PageHeader } from "@/components/layout/page-chrome";
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
import { useMetaTags } from "@/hooks/use-meta-tags";

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
  basics: "bg-sf-azure/[0.06] border border-sf-azure text-sf-azure-text",
  science: "bg-sf-emerald/[0.06] border border-sf-emerald text-sf-emerald-text",
  craft: "bg-sf-violet/[0.06] border border-sf-violet text-sf-violet-text",
  "case-studies": "bg-sf-amber/[0.06] border border-sf-amber text-sf-amber-text",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  upcoming: { label: "UPCOMING", className: "bg-sf-surface-elevated border-sf-line text-t3" },
  enrolling: { label: "ENROLLING NOW", className: "bg-sf-emerald/[0.06] border-sf-emerald text-sf-emerald-text" },
  in_progress: { label: "IN SESSION", className: "bg-sf-amber/[0.06] border-sf-amber text-sf-amber-text" },
};

function CourseDiscountBadge({ course, courseDiscount, tier }: { course: CourseListItem; courseDiscount: string; tier: string }) {
  // Determine which discount string to show based on user's tier/plan
  if (tier === "free" || courseDiscount === "0%") {
    // Show generic "Members save" message
    const maxDiscount = course.vanguardYearlyDiscount || "25%";
    return (
      <span className="text-xs text-sf-violet-text">Members save up to {maxDiscount}</span>
    );
  }

  return (
    <Badge className="bg-sf-violet/[0.06] border border-sf-violet text-sf-violet-text text-xs">
      {courseDiscount} off
    </Badge>
  );
}

const LearnIndex = () => {
  useMetaTags({ title: "SF University" });
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
    <div className="min-h-screen bg-sf-void">
      <Header />

      <main className="relative">
        <PageContainer variant="standalone">
        <PageBursts bursts={LEARN_INDEX_BURSTS} />
        {/* Top-level hub: no back link (the logo goes home). */}
        <PageHeader
          size="page"
          eyebrow="Archive"
          title="SF University"
          lede="Deep dives into worldbuilding concepts, science for storytellers, and the craft of creating believable fictional universes."
          actions={
            <>
              <Button asChild variant="sf-ghost" size="sf-md">
                <a href="#courses">Courses</a>
              </Button>
              <Button asChild variant="sf-ghost" size="sf-md">
                <Link to="/roadmap">Roadmap</Link>
              </Button>
            </>
          }
        >
          {/* Cross-section navigation */}
          <GuideNav />
        </PageHeader>

        {/* Search */}
        <div className="relative max-w-md mb-10">
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
          <Notice tone="caution" label="Archive offline" className="mb-8">
            Unable to load articles from the CMS. Showing cached content.
          </Notice>
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
                <h2 className="font-display text-sf-h3 font-light text-t1 mb-6">
                  Results for &ldquo;{searchTerm}&rdquo;
                </h2>
                <div className="space-y-4">
                  {searchResults.map((article) => (
                    <Link key={article._id} to={`/learn/${article.slug}`}>
                      <GlassPanel className="p-4 hover:bg-sf-surface-elevated transition-colors cursor-pointer group">
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
                            <h3 className="font-medium group-hover:text-sf-primary-text transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-sm text-t2 mt-1">
                              {article.description}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-t3 group-hover:text-sf-primary-text transition-colors shrink-0 mt-1" />
                        </div>
                      </GlassPanel>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {!isSearching && searchResults && searchResults.length === 0 && (
              <p className="text-center text-t2 py-8">
                No articles found for &ldquo;{searchTerm}&rdquo;
              </p>
            )}
          </section>
        )}

        {/* Featured Articles */}
        {!isLoading && !isSearchActive && featuredArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-sf-h3 font-light text-t1 mb-6">
              Featured
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredArticles.map((article) => (
                <Link key={article._id} to={`/learn/${article.slug}`}>
                  <GlassPanel
                    glow
                    className="overflow-hidden h-full hover:bg-sf-surface-elevated transition-colors cursor-pointer group"
                  >
                    {article.featuredImage?.asset && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={urlFor(article.featuredImage).width(600).height(340).url()}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slow"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <Badge className={categoryColors[article.category]}>
                        {categoryLabels[article.category]}
                      </Badge>
                      <h3 className="font-heading text-xl font-medium mt-3 mb-2 group-hover:text-sf-primary-text transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-t2 text-sm mb-4">
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
                        <span className="text-sf-primary-text text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
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
              <h2 className="font-display text-sf-h3 font-light text-t1">
                Simulator science: showing our work
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Link to="/rogue/science">
                <GlassPanel className="p-5 h-full hover:bg-sf-surface-elevated transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-none flex items-center justify-center bg-gradient-to-br from-sf-crimson/20 to-sf-amber/20 overflow-hidden">
                      <img src="/icons/035-black hole.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-sf-primary-text transition-colors">
                    ROGUE: The Science
                  </h3>
                  <p className="text-sm text-t2 mt-1">
                    The real astrophysics behind gravitational encounters, rogue planets, and N-body dynamics.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/tidelock/science">
                <GlassPanel className="p-5 h-full hover:bg-sf-surface-elevated transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-none flex items-center justify-center bg-gradient-to-br from-sf-primary/20 to-sf-azure/20 overflow-hidden">
                      <img src="/icons/044-day and night.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-sf-primary-text transition-colors">
                    TIDELOCK: The Science
                  </h3>
                  <p className="text-sm text-t2 mt-1">
                    The science of tidally locked worlds, atmospheric circulation, and habitability around red dwarf stars.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/exosky/science">
                <GlassPanel className="p-5 h-full hover:bg-sf-surface-elevated transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-none flex items-center justify-center bg-gradient-to-br from-sf-violet/20 to-sf-violet/20 overflow-hidden">
                      <img src="/icons/016-constellation.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-sf-primary-text transition-colors">
                    EXOSKY: The Science
                  </h3>
                  <p className="text-sm text-t2 mt-1">
                    How real stellar catalogs, parallax, and coordinate transforms create accurate alien night skies.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/exoforge/science">
                <GlassPanel className="p-5 h-full hover:bg-sf-surface-elevated transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-none flex items-center justify-center bg-gradient-to-br from-sf-emerald/20 to-sf-primary/20 overflow-hidden">
                      <img src="/icons/025-planet-earth.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-sf-primary-text transition-colors">
                    EXOFORGE: The Science
                  </h3>
                  <p className="text-sm text-t2 mt-1">
                    Terrain generation, composition spectra, biome models, and the physics behind procedural exoplanet forging.
                  </p>
                </GlassPanel>
              </Link>
              <Link to="/tools/solaris/science">
                <GlassPanel className="p-5 h-full hover:bg-sf-surface-elevated transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-none flex items-center justify-center bg-gradient-to-br from-sf-amber/20 to-sf-amber/20 overflow-hidden">
                      <img src="/icons/022-solar system.svg" alt="" className="w-6 h-6" draggable={false} />
                    </div>
                    <Badge variant="outline" className={categoryColors.science}>
                      {categoryLabels.science}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:text-sf-primary-text transition-colors">
                    SOLARIS: The Science
                  </h3>
                  <p className="text-sm text-t2 mt-1">
                    Keplerian orbits, multi-star stability limits, the Kopparapu habitable zone, and the N-body integrator behind every system.
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
              <h2 className="font-display text-sf-h3 font-light text-t1">
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
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slow"
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
                          <Badge key={tag} variant="outline" className="text-t3 border-sf-line">
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
              <GlassPanel className="p-4 mt-4 border-sf-violet text-center">
                <p className="text-sm text-t2">
                  <Zap className="w-3.5 h-3.5 inline-block mr-1 text-sf-amber-text -mt-0.5" />
                  Pro members save 5–10% on all courses.{" "}
                  <Sparkles className="w-3.5 h-3.5 inline-block mr-1 text-sf-violet -mt-0.5" />
                  Vanguard members save up to 25%.{" "}
                  <Link to="/pricing" className="text-sf-primary-text hover:underline">
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
            <h2 className="font-display text-sf-h3 font-light text-t1 mb-6">
              All articles
            </h2>
            <div className="space-y-6">
              {articles.map((article) => (
                <Link key={article._id} to={`/learn/${article.slug}`} className="block">
                  <GlassPanel className="p-0 overflow-hidden hover:bg-sf-surface-elevated transition-colors cursor-pointer group">
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
                        <div className="w-32 md:w-48 shrink-0 bg-sf-surface-elevated flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-t4" />
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
                          <h3 className="font-medium group-hover:text-sf-primary-text transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-t2 mt-1 line-clamp-2">
                            {article.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-t3 group-hover:text-sf-primary-text transition-colors shrink-0 mt-1" />
                      </div>
                    </div>
                  </GlassPanel>
                </Link>
              ))}
            </div>
          </section>
        )}
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default LearnIndex;

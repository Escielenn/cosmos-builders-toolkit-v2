import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Notice, PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useArticles, useSearchArticles } from "@/hooks/use-sanity-articles";
import { useFeaturedCourses } from "@/hooks/use-courses";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { GuideNav } from "@/components/layout/GuideNav";
import { getToolIcon } from "@/components/icons/tool-icons";
import { CoverArt } from "@/components/learn/CoverArt";
import { ArticlePhoto, PhotoCredit, PhotoCredits } from "@/components/learn/ArticlePhoto";
import { CATEGORY_LABELS, formatArticleDate } from "@/components/learn/article-meta";
import { PRICING } from "@/lib/tools-config";
import type { ArticleListItem, CourseListItem } from "@/lib/sanity/types";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { cn } from "@/lib/utils";

// Fallback static articles (shown when Sanity has no content yet)
const fallbackArticles: ArticleListItem[] = [
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

const SIMULATOR_SCIENCE = [
  { id: "rogue", name: "Rogue", to: "/rogue/science", body: "Gravitational encounters, rogue planets and N-body dynamics." },
  { id: "tidelock", name: "Tidelock", to: "/tools/tidelock/science", body: "Tidally locked worlds, atmospheric circulation and red-dwarf habitability." },
  { id: "exosky", name: "Exosky", to: "/tools/exosky/science", body: "Stellar catalogs, parallax and the coordinate transforms behind alien skies." },
  { id: "exoforge", name: "ExoForge", to: "/tools/exoforge/science", body: "Terrain generation, composition spectra and biome models." },
  { id: "solaris", name: "Solaris", to: "/tools/solaris/science", body: "Keplerian orbits, multi-star stability and the Kopparapu habitable zone." },
] as const;

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "border-sf-line-emphasis text-t2" },
  enrolling: { label: "Enrolling now", className: "border-sf-primary text-sf-primary-text" },
  in_progress: { label: "In session", className: "border-sf-line-emphasis text-t2" },
};

// Section headings (15-PAGE-CHROME §4): named blocks, display h3.
const sectionHeading = "font-display text-sf-h3 font-light text-t1 mb-6";

function ArticleMeta({ article }: { article: ArticleListItem }) {
  return (
    <p className="mb-2 font-mono text-sf-mono uppercase text-t4">
      {CATEGORY_LABELS[article.category] ?? "Article"} · {formatArticleDate(article.publishedDate)}
    </p>
  );
}

function FeaturedArticle({ article }: { article: ArticleListItem }) {
  // The card is one link (stretched over it from the title); the photo credit
  // sits above that layer so its own links still work.
  return (
    <article className="group relative grid overflow-hidden border border-sf-line bg-sf-surface sf-card-hover md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="aspect-video w-full overflow-hidden md:aspect-auto md:min-h-[300px]">
        <ArticlePhoto slug={article.slug} category={article.category} variant="featured" eager />
      </div>
      <div className="flex flex-col justify-center p-6 md:p-8">
        <ArticleMeta article={article} />
        <h3 className="mb-3 font-heading text-sf-h2 font-normal text-t1 transition-colors duration-base group-hover:text-sf-primary-text">
          <Link to={`/learn/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </h3>
        <p className="mb-4 text-sf-body text-t2">{article.description}</p>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-sf-primary-text">
          Read the article <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
        <PhotoCredit slug={article.slug} category={article.category} className="relative z-[1] mt-4" />
      </div>
    </article>
  );
}

function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <Link to={`/learn/${article.slug}`} className="group flex h-full flex-col border border-sf-line bg-sf-surface sf-card-hover">
      <div className="aspect-video w-full overflow-hidden border-b border-sf-line-hairline">
        <ArticlePhoto slug={article.slug} category={article.category} variant="card" />
      </div>
      <div className="flex-1 p-5">
        <ArticleMeta article={article} />
        <h3 className="mb-2 line-clamp-2 font-heading text-lg font-normal text-t1 transition-colors duration-base group-hover:text-sf-primary-text">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm text-t2">{article.description}</p>
      </div>
    </Link>
  );
}

function CourseCard({ course, courseDiscount, tier }: { course: CourseListItem; courseDiscount: string; tier: string }) {
  const status = STATUS_LABELS[course.status] || STATUS_LABELS.upcoming;
  const discount =
    tier === "free" || courseDiscount === "0%"
      ? `Members save up to ${course.vanguardYearlyDiscount || PRICING.vanguard.yearly.courseDiscount}`
      : `${courseDiscount} off with your plan`;
  return (
    <article className="flex h-full flex-col border border-sf-line bg-sf-surface">
      <div className="aspect-[21/9] w-full overflow-hidden border-b border-sf-line-hairline">
        <CoverArt seed={course.slug || course._id} glyph="course" category="teal" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-sf-tag border px-1.5 font-mono text-sf-mono uppercase", status.className)}>
            {status.label}
          </span>
          {course.tags?.map((tag) => (
            <span key={tag} className="font-mono text-sf-mono uppercase text-t4">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="mb-2 font-heading text-sf-h3 font-normal text-t1">{course.title}</h3>
        <p className="mb-3 font-mono text-sf-mono uppercase text-t4">
          {[course.instructor, course.startDate && formatArticleDate(course.startDate), course.duration]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mb-5 line-clamp-3 flex-1 text-sm leading-relaxed text-t2">{course.description}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono text-t1">{course.price}</span>
            <span className="ml-3 text-sm text-t3">{discount}</span>
          </div>
          <Button asChild variant="sf-primary" size="sf-sm" className="gap-1.5">
            <a href={course.registrationUrl} target="_blank" rel="noopener noreferrer">
              Register
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </Button>
        </div>
      </div>
    </article>
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
  const articles = sanityArticles && sanityArticles.length > 0 ? sanityArticles : fallbackArticles;

  const featuredArticles = articles.filter((a) => a.featured);
  const otherArticles = articles.filter((a) => !a.featured);
  const browsing = !isLoading && !isSearchActive;

  return (
    <div className="min-h-screen bg-sf-void">
      <Header />

      <main className="relative">
        <PageContainer variant="standalone">
          {/* Top-level hub: no back link (the logo goes home). */}
          <PageHeader
            size="page"
            eyebrow="Learn"
            title="SF University"
            lede="Articles on worldbuilding, science for storytellers, and the craft of believable fictional universes."
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
            <GuideNav />
          </PageHeader>

          {/* Search */}
          <div className="relative mb-12 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-t3" aria-hidden />
            <Input
              placeholder="Search articles"
              aria-label="Search articles"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          )}

          {error && !isLoading && (
            <Notice tone="caution" label="Archive offline" className="mb-8">
              Couldn't load the latest articles. Showing saved copies.
            </Notice>
          )}

          {/* Search results */}
          {isSearchActive && !isLoading && (
            <section aria-label="Search results" className="mb-16">
              {isSearching && (
                <div className="flex justify-center py-8">
                  <Loader size="sm" />
                </div>
              )}
              {!isSearching && searchResults && searchResults.length > 0 && (
                <>
                  <h2 className={sectionHeading}>Results for &ldquo;{searchTerm}&rdquo;</h2>
                  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {searchResults.map((article) => (
                      <li key={article._id}>
                        <ArticleCard article={article} />
                      </li>
                    ))}
                  </ul>
                  <PhotoCredits articles={searchResults} className="mt-3" />
                </>
              )}
              {!isSearching && searchResults && searchResults.length === 0 && (
                <p className="py-8 text-center text-t2">NO ARTICLES ON FILE FOR &ldquo;{searchTerm}&rdquo;.</p>
              )}
            </section>
          )}

          {/* Featured */}
          {browsing && featuredArticles.length > 0 && (
            <section aria-labelledby="learn-featured" className="mb-16">
              <h2 id="learn-featured" className={sectionHeading}>
                Featured
              </h2>
              <div className="space-y-6">
                {featuredArticles.map((article) => (
                  <FeaturedArticle key={article._id} article={article} />
                ))}
              </div>
            </section>
          )}

          {/* All other articles */}
          {browsing && otherArticles.length > 0 && (
            <section aria-labelledby="learn-articles" className="mb-16">
              <h2 id="learn-articles" className={sectionHeading}>
                Articles
              </h2>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {otherArticles.map((article) => (
                  <li key={article._id}>
                    <ArticleCard article={article} />
                  </li>
                ))}
              </ul>
              <PhotoCredits articles={otherArticles} className="mt-3" />
            </section>
          )}

          {/* Simulator science */}
          {browsing && (
            <section aria-labelledby="learn-science" className="mb-16">
              <h2 id="learn-science" className={sectionHeading}>
                Simulator science: showing our work
              </h2>
              <ul className="grid border-t border-sf-line sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3">
                {SIMULATOR_SCIENCE.map((s) => {
                  const Icon = getToolIcon(s.id);
                  return (
                    <li key={s.id} className="border-b border-sf-line-hairline">
                      <Link to={s.to} className="group flex min-h-hit items-start gap-4 py-4">
                        {Icon ? <Icon className="mt-0.5 h-8 w-8 shrink-0" /> : null}
                        <span>
                          <span className="block font-heading text-base text-t1 transition-colors duration-base group-hover:text-sf-primary-text">
                            {s.name}: the science
                          </span>
                          <span className="mt-1 block text-sm text-t2">{s.body}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Courses */}
          {browsing && featuredCourses.length > 0 && (
            <section id="courses" aria-labelledby="learn-courses" className="mb-16 scroll-mt-24">
              <h2 id="learn-courses" className={sectionHeading}>
                Courses
              </h2>
              <ul className="grid gap-6 md:grid-cols-2">
                {featuredCourses.map((course) => (
                  <li key={course._id}>
                    <CourseCard course={course} courseDiscount={courseDiscount} tier={tier} />
                  </li>
                ))}
              </ul>
              {!user && (
                <p className="mt-6 text-sm text-t2">
                  {`Pro members save ${PRICING.pro.monthly.courseDiscount}–${PRICING.pro.yearly.courseDiscount} on every course; Vanguard members save up to ${PRICING.vanguard.yearly.courseDiscount}. `}
                  <Link to="/pricing" className="text-sf-primary-text underline-offset-4 hover:underline">
                    View plans
                  </Link>
                </p>
              )}
            </section>
          )}
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default LearnIndex;

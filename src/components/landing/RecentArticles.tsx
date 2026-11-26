import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useArticles } from "@/hooks/use-sanity-articles";
import { ArticlePhoto, PhotoCredits } from "@/components/learn/ArticlePhoto";
import { CATEGORY_LABELS, formatArticleDate } from "@/components/learn/article-meta";
import { MarketingSection, SectionHeading } from "./marketing-ui";

/**
 * "Latest from SF University": three articles, each with its credited
 * Unsplash photograph (the generated cover is the fallback; finding 6: no
 * CMS cover images). Shown on the landing and on Home.
 */
const RecentArticles = () => {
  const { data: articles, isLoading } = useArticles();

  if (isLoading || !articles || articles.length === 0) {
    return null;
  }

  const recent = articles.slice(0, 3);

  return (
    <MarketingSection id="latest" labelledBy="latest-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6">
        <SectionHeading id="latest-title" label="SF University" title="Latest from the archive" />
        <Link
          to="/learn"
          className="mb-10 inline-flex min-h-hit items-center gap-2 font-sans text-sm font-medium text-sf-primary-text transition-colors duration-base ease-sf-out hover:text-t1 md:mb-12"
        >
          All articles
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {recent.map((article) => (
          <li key={article._id}>
            <Link to={`/learn/${article.slug}`} className="group block h-full border border-sf-line bg-sf-surface sf-card-hover">
              <div className="aspect-video w-full overflow-hidden border-b border-sf-line-hairline">
                <ArticlePhoto slug={article.slug} category={article.category} variant="card" />
              </div>
              <div className="p-5">
                <p className="mb-2 font-mono text-sf-mono uppercase text-t4">
                  {CATEGORY_LABELS[article.category] ?? "Article"} · {formatArticleDate(article.publishedDate)}
                </p>
                <h3 className="line-clamp-2 font-heading text-lg font-normal text-t1 transition-colors duration-base group-hover:text-sf-primary-text">
                  {article.title}
                </h3>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <PhotoCredits articles={recent} className="mt-3" />
    </MarketingSection>
  );
};

export default RecentArticles;

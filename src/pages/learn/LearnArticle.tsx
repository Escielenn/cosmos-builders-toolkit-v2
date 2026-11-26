import { useParams } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { EmptyState } from "@/components/ui/empty-state";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useArticle } from "@/hooks/use-sanity-articles";
import { PortableTextRenderer } from "@/components/sanity/PortableTextRenderer";
import { ArticlePhoto, PhotoCredit } from "@/components/learn/ArticlePhoto";
import { CATEGORY_LABELS, formatArticleDate } from "@/components/learn/article-meta";
// Fallback MDX content for when Sanity is empty
import DrakeEquationContent from "@/content/learn/drake-equation/index.mdx";

// Fallback article metadata (for MDX content)
const fallbackMeta: Record<
  string,
  {
    title: string;
    description: string;
    category: string;
    publishedDate: string;
    content: React.ComponentType;
  }
> = {
  "drake-equation": {
    title: "The Drake Equation: A Worldbuilder's Tool",
    description:
      "How the famous equation for estimating extraterrestrial civilizations can help you design believable alien worlds and galactic settings.",
    category: "science",
    publishedDate: "2026-01-22",
    content: DrakeEquationContent,
  },
};

const LearnArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: sanityArticle, isLoading, error } = useArticle(slug);

  // Check for fallback MDX content
  const fallbackArticle = slug ? fallbackMeta[slug] : null;

  // Use Sanity article if available, otherwise use fallback
  const useSanityContent = sanityArticle && sanityArticle.content;
  const article = useSanityContent
    ? {
        title: sanityArticle.title,
        description: sanityArticle.description,
        category: sanityArticle.category,
        publishedDate: sanityArticle.publishedDate,
      }
    : fallbackArticle;

  useMetaTags({ title: article?.title ?? "SF University", description: article?.description });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-sf-void">
        <Header />
        <main>
          <PageContainer variant="standalone" className="flex justify-center">
            <Loader />
          </PageContainer>
        </main>
      </div>
    );
  }

  // Not found state
  if (!article) {
    return (
      <div className="min-h-screen bg-sf-void">
        <Header />
        <main>
          <PageContainer variant="standalone">
            <PageHeader
              size="page"
              back={{ label: "Back to Learn", to: "/learn" }}
              eyebrow="Learn"
              title="Article not on file"
              lede="This article doesn't exist or hasn't been published yet."
            />
            <EmptyState
              title="ARTICLE NOT ON FILE."
              actionLabel="OPEN SF UNIVERSITY"
              actionTo="/learn"
            />
          </PageContainer>
        </main>
      </div>
    );
  }

  // Render MDX fallback content
  const FallbackContent = fallbackArticle?.content;

  return (
    <div className="min-h-screen bg-sf-void">
      <Header />

      <main className="relative">
        <PageContainer variant="standalone">
        {/* Child page: one back link to its real parent. */}
        <PageHeader
          size="page"
          back={{ label: "Back to Learn", to: "/learn" }}
          eyebrow={CATEGORY_LABELS[article.category] ?? "Learn"}
          title={article.title}
          lede={article.description}
        >
          <p className="font-mono text-sf-mono uppercase text-t4">
            SF University · {formatArticleDate(article.publishedDate, "long")}
          </p>
        </PageHeader>

        {/* Reading column, left-aligned on the shared edge. */}
        <div className="max-w-4xl">

        {/* Hero photograph (Unsplash, credited), toned with tokens. The
            generated cover (finding 6) shows while it loads and stays if it
            fails. Never the CMS image. */}
        <figure className="mb-8">
          <div className="aspect-[1200/500] w-full overflow-hidden border border-sf-line">
            <ArticlePhoto slug={slug ?? article.title} category={article.category} variant="hero" eager />
          </div>
          <figcaption>
            <PhotoCredit slug={slug ?? article.title} category={article.category} />
          </figcaption>
        </figure>

        {/* Article Content */}
        <GlassPanel className="p-6 md:p-10">
          <article className="prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-headings:font-medium prose-a:text-sf-primary-text prose-a:no-underline hover:prose-a:underline prose-blockquote:border-sf-primary prose-blockquote:not-italic prose-code:bg-sf-surface-elevated prose-code:px-1 prose-code:py-0.5 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none">
            {useSanityContent ? (
              <PortableTextRenderer content={sanityArticle.content} />
            ) : FallbackContent ? (
              <FallbackContent />
            ) : (
              <p className="text-t2">
                CONTENT NOT AVAILABLE.
              </p>
            )}
          </article>
        </GlassPanel>
        </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default LearnArticle;

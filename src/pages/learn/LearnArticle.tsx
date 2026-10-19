import { useParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { EmptyState } from "@/components/ui/empty-state";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { useArticle } from "@/hooks/use-sanity-articles";
import { PortableTextRenderer } from "@/components/sanity/PortableTextRenderer";
import { urlFor } from "@/lib/sanity/client";
import { PageBursts } from "@/components/ui/data-burst";
import { LEARN_ARTICLE_BURSTS } from "@/lib/data-bursts";
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
              back={{ label: "Back to SF University", to: "/learn" }}
              eyebrow="SF University"
              title="Article not on file"
              lede="This article doesn't exist or hasn't been published yet."
            />
            <EmptyState
              title="ARTICLE NOT ON FILE."
              actionLabel="OPEN THE ARCHIVE"
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
        <PageBursts bursts={LEARN_ARTICLE_BURSTS} />

        {/* Child page: one back link to its real parent. */}
        <PageHeader
          size="page"
          back={{ label: "Back to SF University", to: "/learn" }}
          eyebrow={categoryLabels[article.category] ?? "SF University"}
          title={article.title}
          lede={article.description}
        >
          <div className="flex flex-wrap items-center gap-4 text-sm text-t3">
            <Badge className={categoryColors[article.category]}>
              {categoryLabels[article.category]}
            </Badge>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" aria-hidden />
              {new Date(article.publishedDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </PageHeader>

        {/* Reading column, left-aligned on the shared edge. */}
        <div className="max-w-4xl">

        {/* Featured Image */}
        {useSanityContent && sanityArticle.featuredImage?.asset && (
          <div className="mb-8 rounded-none overflow-hidden">
            <img
              src={urlFor(sanityArticle.featuredImage).width(1200).height(630).url()}
              alt={article.title}
              className="w-full h-auto"
            />
          </div>
        )}

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

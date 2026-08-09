import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
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
  basics: "bg-blue-500/20 text-blue-400",
  science: "bg-green-500/20 text-green-400",
  craft: "bg-purple-500/20 text-purple-400",
  "case-studies": "bg-amber-500/20 text-sf-amber",
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16 flex justify-center">
          <Loader />
        </main>
      </div>
    );
  }

  // Not found state
  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-sm text-t3 hover:text-t1 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            ← RETURN TO ARCHIVE
          </Link>
          <GlassPanel className="p-8 text-center">
            <h1 className="text-2xl font-medium mb-2">Article Not Found</h1>
            <p className="text-t3">
              This article doesn't exist or hasn't been published yet.
            </p>
          </GlassPanel>
        </main>
      </div>
    );
  }

  // Render MDX fallback content
  const FallbackContent = fallbackArticle?.content;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <PageBursts bursts={LEARN_ARTICLE_BURSTS} />
        {/* Back Link */}
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 text-sm text-t3 hover:text-t1 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          ← RETURN TO ARCHIVE
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <Badge className={categoryColors[article.category]}>
            {categoryLabels[article.category]}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-medium mt-4 mb-4">
            {article.title}
          </h1>
          <p className="text-lg text-t3 mb-4">
            {article.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-t3">
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
          <article className="prose prose-invert prose-lg max-w-none prose-headings:font-heading prose-headings:font-medium prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary prose-blockquote:not-italic prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            {useSanityContent ? (
              <PortableTextRenderer content={sanityArticle.content} />
            ) : FallbackContent ? (
              <FallbackContent />
            ) : (
              <p className="text-t3">
                Content not available.
              </p>
            )}
          </article>
        </GlassPanel>

        {/* ← RETURN TO ARCHIVE */}
        <div className="mt-8 text-center">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            ← RETURN TO ARCHIVE
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LearnArticle;

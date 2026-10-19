import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { useArticles } from "@/hooks/use-sanity-articles";
import { urlFor } from "@/lib/sanity/client";
import { scrollRevealStagger, fadeUpItem, scrollReveal, viewportOnce } from "@/lib/animations";

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

const RecentArticles = () => {
  const { data: articles, isLoading } = useArticles();

  if (isLoading || !articles || articles.length === 0) {
    return null;
  }

  const recent = articles.slice(0, 3);

  return (
    <section className="mt-16 mb-8">
      <motion.div
        className="flex items-center justify-between mb-8"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={scrollReveal}
      >
        <h2 className="font-display text-sf-h3 font-light text-t1 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-sf-primary-text" />
          Latest from SF University
        </h2>
        <Link
          to="/learn"
          className="text-sm text-t3 hover:text-sf-primary-text transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      <motion.div
        className={`grid gap-6 grid-cols-1 ${
          recent.length >= 2 ? "md:grid-cols-2" : ""
        } ${recent.length >= 3 ? "lg:grid-cols-3" : ""}`}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={scrollRevealStagger}
      >
        {recent.map((article) => (
          <motion.div key={article._id} variants={fadeUpItem}>
            <Link to={`/learn/${article.slug}`}>
              <GlassPanel className="overflow-hidden h-full hover:bg-sf-surface-elevated transition-colors cursor-pointer group">
                {article.featuredImage?.asset && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={urlFor(article.featuredImage)
                        .width(400)
                        .height(225)
                        .url()}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slow"
                    />
                  </div>
                )}
                <div className="p-4">
                  <Badge className={categoryColors[article.category]}>
                    {categoryLabels[article.category]}
                  </Badge>
                  <h3 className="font-heading font-medium mt-2 mb-1 line-clamp-2 group-hover:text-sf-primary-text transition-colors">
                    {article.title}
                  </h3>
                  <span className="text-xs text-t3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.publishedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </GlassPanel>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default RecentArticles;

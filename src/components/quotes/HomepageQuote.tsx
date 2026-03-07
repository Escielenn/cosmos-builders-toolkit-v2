import { useMemo } from "react";
import { motion } from "framer-motion";
import { scrollReveal, viewportOnce } from "@/lib/animations";
import { getHomepageQuote } from "@/lib/sf-quotes";

export function HomepageQuote() {
  const quote = useMemo(() => getHomepageQuote(), []);

  if (!quote) return null;

  return (
    <motion.div
      className="py-8 md:py-12 max-w-3xl mx-auto text-center"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={scrollReveal}
    >
      <blockquote className="relative px-6 md:px-12">
        <span
          className="absolute top-0 left-0 text-4xl text-primary/10 font-display leading-none select-none"
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <p className="text-lg md:text-xl italic text-tier-2 leading-relaxed">
          {quote.text}
        </p>
        <span
          className="absolute bottom-0 right-0 text-4xl text-primary/10 font-display leading-none select-none"
          aria-hidden="true"
        >
          &rdquo;
        </span>
      </blockquote>

      <footer className="mt-4 flex items-center justify-center gap-2 flex-wrap">
        <span className="font-mono text-xs text-tier-3">
          {quote.author}
        </span>
        <span className="text-tier-5 text-xs">&mdash;</span>
        <span className="font-mono text-xs text-primary/60">
          <em>{quote.source}</em>
        </span>
        <span className="text-tier-5 text-[10px] hidden sm:inline">|</span>
        <span className="hidden sm:flex items-center gap-2">
          <a
            href={quote.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-tier-4 hover:text-amber-400 transition-colors uppercase tracking-[1px]"
          >
            Amazon
          </a>
          <a
            href={quote.bookshopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-tier-4 hover:text-emerald-400 transition-colors uppercase tracking-[1px]"
          >
            Bookshop
          </a>
        </span>
      </footer>
    </motion.div>
  );
}

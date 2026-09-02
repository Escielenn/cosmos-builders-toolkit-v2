import { useMemo } from "react";
import { motion } from "framer-motion";
import { scrollReveal, viewportOnce } from "@/lib/animations";
import { getHomepageQuote } from "@/lib/sf-quotes";
import { trackAffiliateClick } from "@/hooks/use-affiliate-tracking";

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
        <p className="text-lg md:text-xl italic text-t2 leading-relaxed">
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
        <span className="font-mono text-xs text-t3">
          {quote.author}
        </span>
        <span className="text-t4 text-xs">-</span>
        <span className="font-mono text-xs text-primary/60">
          <em>{quote.source}</em>
        </span>
        {quote.affiliateUrl && (
          <>
            <span className="text-t4 text-[12px] hidden sm:inline">|</span>
            <a
              href={quote.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-[12px] text-t4 hover:text-primary transition-colors"
              onClick={() => trackAffiliateClick(quote.isbn, quote.affiliateUrl!)}
            >
              Get the book &rarr;
            </a>
          </>
        )}
        <span className="text-t4 text-[12px] hidden sm:inline">|</span>
        <span className="hidden sm:flex items-center gap-2">
          <a
            href={quote.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-t4 hover:text-sf-amber transition-colors uppercase tracking-[1px]"
            onClick={() => trackAffiliateClick(quote.isbn, quote.amazonUrl)}
          >
            Amazon
          </a>
          <a
            href={quote.bookshopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-t4 hover:text-sf-emerald transition-colors uppercase tracking-[1px]"
            onClick={() => trackAffiliateClick(quote.isbn, quote.bookshopUrl)}
          >
            Bookshop
          </a>
        </span>
      </footer>
    </motion.div>
  );
}

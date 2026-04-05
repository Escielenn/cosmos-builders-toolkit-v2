import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { getToolQuote } from "@/lib/sf-quotes";

interface ToolPageQuoteProps {
  toolId: string;
}

export function ToolPageQuote({ toolId }: ToolPageQuoteProps) {
  const quote = useMemo(() => getToolQuote(toolId), [toolId]);

  if (!quote) return null;

  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="shrink-0 mt-1">
        <BookOpen className="w-3.5 h-3.5 text-tier-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm italic text-tier-3 leading-relaxed line-clamp-2">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] text-tier-4">
            {quote.author}
          </span>
          <span className="text-tier-5 text-[10px]">&mdash;</span>
          <span className="font-mono text-[11px] text-primary/60">
            <em>{quote.source}</em>
          </span>
          {quote.affiliateUrl && (
            <>
              <span className="text-tier-5">|</span>
              <a
                href={quote.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-tier-4 hover:text-primary transition-colors"
              >
                Get the book &rarr;
              </a>
            </>
          )}
          <span className="text-tier-5">|</span>
          <a
            href={quote.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-tier-4 hover:text-amber-400 transition-colors"
          >
            Amazon
          </a>
          <a
            href={quote.bookshopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-tier-4 hover:text-emerald-400 transition-colors"
          >
            Bookshop
          </a>
        </p>
      </div>
    </div>
  );
}

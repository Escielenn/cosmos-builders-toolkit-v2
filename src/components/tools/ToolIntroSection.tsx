import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { ToolIntroData } from "@/lib/tool-intros";

interface ToolIntroSectionProps {
  data: ToolIntroData;
}

/**
 * The tool's purpose, with its examples from published SF folded away.
 *
 * 1.9 F-12: the essay used to open in full, so a tool's first input sat
 * 1,282 to 2,358 px down at 1440×900. The purpose stays visible (one
 * paragraph); the examples open on request.
 */
const ToolIntroSection = ({ data }: ToolIntroSectionProps) => {
  const [open, setOpen] = useState(false);
  const panelId = `intro-examples-${data.title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <GlassPanel glow className="mb-6 p-4 md:p-5">
      <h2 className="mb-2 font-heading text-sf-h3 font-light uppercase text-t1">{data.title}</h2>
      <p className="sf-measure text-sf-body text-t2">{data.purpose}</p>

      {data.examples.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className="mt-2 inline-flex min-h-hit items-center gap-1.5 text-[13px] text-sf-primary-text hover:text-t1"
          >
            {open ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
            {open ? "Hide" : "Show"} how published science fiction does this ({data.examples.length})
          </button>
          {open && (
            <div id={panelId} className="mt-3 space-y-5">
              {data.examples.map((example, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium">
                    <Link to={`/bookshelf#${example.isbn}`} className="text-sf-primary-text hover:underline">
                      <em>{example.bookTitle}</em>
                    </Link>{" "}
                    by {example.author} ({example.year})
                  </p>
                  {example.quotes.map((quote, qi) => (
                    <blockquote key={qi} className="sf-measure border-l-2 border-sf-primary pl-4 text-sm italic text-t2">
                      &ldquo;{quote}&rdquo;
                    </blockquote>
                  ))}
                  <p className="sf-measure text-sm text-t2">{example.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </GlassPanel>
  );
};

export default ToolIntroSection;

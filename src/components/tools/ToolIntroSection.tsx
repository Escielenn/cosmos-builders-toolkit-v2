import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { ToolIntroData } from "@/lib/tool-intros";

interface ToolIntroSectionProps {
  data: ToolIntroData;
}

const ToolIntroSection = ({ data }: ToolIntroSectionProps) => {
  return (
    <GlassPanel glow className="p-6 md:p-8 mb-8">
      <h2 className="font-heading text-xl font-light uppercase tracking-[2px] mb-3 gradient-text">
        {data.title}
      </h2>
      <p className="text-t3 mb-6">{data.purpose}</p>

      <h4 className="font-heading text-xs font-medium uppercase tracking-sf-wide text-t4 mb-4">
        In Published Science Fiction
      </h4>

      <div className="space-y-5">
        {data.examples.map((example, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm font-medium">
              <Link
                to={`/bookshelf#${example.isbn}`}
                className="text-primary hover:underline"
              >
                <em>{example.bookTitle}</em>
              </Link>{" "}
              by {example.author} ({example.year})
            </p>
            {example.quotes.map((quote, qi) => (
              <blockquote
                key={qi}
                className="border-l-2 border-primary pl-4 italic text-sm text-t3"
              >
                &ldquo;{quote}&rdquo;
              </blockquote>
            ))}
            <p className="text-sm text-t3">{example.explanation}</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};

export default ToolIntroSection;

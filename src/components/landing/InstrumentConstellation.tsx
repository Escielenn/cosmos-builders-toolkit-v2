import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getToolIcon } from "@/components/icons/tool-icons";
import { accentBgClass, accentTextClass } from "@/lib/tool-accents";
import { FREE_TOOL_COUNT, PRO_TOOL_COUNT, SIMULATOR_COUNT, TOTAL_TOOL_COUNT } from "@/lib/tools-config";
import { cn } from "@/lib/utils";
import { groupInstrumentsByLayer, type InstrumentEntry } from "./instrument-layers";
import { MarketingSection, SectionHeading } from "./marketing-ui";

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

/**
 * The instruments, as ONE map grouped by cascade layer (finding 2, 18):
 * glyph + short name per tool, free tools marked, the full catalog one
 * link away. No cards, no descriptions, no "coming soon".
 */
export default function InstrumentConstellation({ withHeading = true }: { withHeading?: boolean }): JSX.Element {
  const groups = groupInstrumentsByLayer();
  const layers = NUMBER_WORDS[groups.length] ?? String(groups.length);

  const map = (
    <>
      <div className="border-t border-sf-line">
        {groups.map(({ layer, tools }) => (
          <div
            key={layer.id}
            className="grid gap-x-8 gap-y-3 border-b border-sf-line-hairline py-5 md:grid-cols-[200px_minmax(0,1fr)]"
          >
            <div>
              <p className="flex items-center gap-2.5 font-heading text-sf-eyebrow uppercase text-t1">
                <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0", accentBgClass(layer.accent))} />
                <span className={accentTextClass(layer.accent)}>{layer.label}</span>
              </p>
              <p className="mt-1.5 text-sm leading-snug text-t3">{layer.blurb}</p>
            </div>
            <ul className="flex flex-wrap gap-x-2 gap-y-1">
              {tools.map((t) => (
                <InstrumentLink key={t.id} tool={t} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-t3">
          <span className="rounded-sf-tag border border-sf-line-emphasis px-1.5 font-mono text-sf-mono uppercase text-t2">
            Free
          </span>{" "}
          with every account. Everything else opens with Pro.
        </p>
        <Link
          to="/tools"
          className="inline-flex min-h-hit items-center gap-2 font-sans text-sm font-medium text-sf-primary-text transition-colors duration-base ease-sf-out hover:text-t1"
        >
          Browse the full catalog
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </>
  );

  if (!withHeading) return map;

  return (
    <MarketingSection id="instruments" labelledBy="instruments-title">
      <SectionHeading
        id="instruments-title"
        label="The instruments"
        title="Every layer of a world, measured"
        lede={`${TOTAL_TOOL_COUNT} instruments across ${layers} cascade layers: ${FREE_TOOL_COUNT} free, ${PRO_TOOL_COUNT} with Pro, including ${SIMULATOR_COUNT} real-time simulators. Each one writes to the same canon.`}
      />
      {map}
    </MarketingSection>
  );
}

function InstrumentLink({ tool }: { tool: InstrumentEntry }): JSX.Element {
  const Icon = getToolIcon(tool.id);
  return (
    <li>
      <Link
        to={tool.route}
        title={tool.fullName}
        aria-label={tool.free ? `${tool.fullName}, free` : tool.fullName}
        className="group inline-flex min-h-hit items-center gap-2.5 border border-transparent px-2.5 transition-colors duration-base ease-sf-out hover:border-sf-line-emphasis hover:bg-sf-surface"
      >
        {Icon ? (
          <Icon className="h-6 w-6 shrink-0" />
        ) : (
          <span aria-hidden className="h-6 w-6 shrink-0 border border-sf-line" />
        )}
        <span className="text-[15px] text-t2 transition-colors duration-base group-hover:text-t1">{tool.shortName}</span>
        {tool.free && (
          <span className="rounded-sf-tag border border-sf-line-emphasis px-1.5 font-mono text-sf-mono uppercase text-t2">
            Free
          </span>
        )}
      </Link>
    </li>
  );
}

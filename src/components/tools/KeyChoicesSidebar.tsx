import { createPortal } from "react-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { KeyValueRow } from "@/components/ui/key-value-row";
import { useRailSlot, useToolRail } from "@/components/tools/tool-rail";
import { useToolReadOnly } from "@/contexts/ToolPreviewContext";

export interface KeyChoice {
  label: string;
  value: string | string[] | undefined;
  /** Optional: format array values as bullets instead of comma-separated */
  asList?: boolean;
}

export interface KeyChoicesSection {
  id: string;
  title: string;
  choices: KeyChoice[];
}

interface KeyChoicesSidebarProps {
  sections: KeyChoicesSection[];
  /** Kept for the call sites; the rail's tab is always "Readout". */
  title?: string;
  /**
   * Kept for the call sites. Inside a ToolPageLayout both modes render into
   * the page's one right rail (the "Readout" tab).
   */
  mode?: "floating" | "inline";
}

export const NO_READOUT_LINE = "// NO DATA ON FILE. FILL A SECTION TO SEE READOUTS.";

function filled(choice: KeyChoice): boolean {
  if (!choice.value) return false;
  if (Array.isArray(choice.value)) return choice.value.length > 0;
  return choice.value.trim() !== "";
}

/**
 * The readout body. Empty groups are not drawn at all (they used to stack
 * eight "// NO DATA ON FILE" rows); with nothing filled the readout is one
 * line telling the writer how to fill it.
 */
export function ReadoutContent({ sections }: { sections: KeyChoicesSection[] }) {
  const groups = sections
    .map((s) => ({ ...s, choices: s.choices.filter(filled) }))
    .filter((s) => s.choices.length > 0);

  if (groups.length === 0) {
    return <p className="px-2 font-mono text-sf-mono uppercase text-t4">{NO_READOUT_LINE}</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.id} aria-label={group.title} className="px-2">
          <h4 className="mb-1.5 border-b border-sf-line-hairline pb-1 font-heading text-sf-eyebrow uppercase text-t4">
            {group.title}
          </h4>
          <div className="space-y-1">
            {group.choices.map((choice, idx) =>
              choice.asList && Array.isArray(choice.value) ? (
                <div key={idx}>
                  <span className="font-mono text-[12px] uppercase text-t4">{choice.label}</span>
                  <ul className="mt-0.5 space-y-0.5">
                    {choice.value.map((v, i) => (
                      <li key={i} className="font-sans text-[13px] text-t1 before:mr-1.5 before:text-t4 before:content-['·']">
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <KeyValueRow
                  key={idx}
                  label={choice.label}
                  value={Array.isArray(choice.value) ? choice.value.join(", ") : choice.value}
                  title={Array.isArray(choice.value) ? choice.value.join(", ") : choice.value}
                  className="tracking-normal"
                />
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

const KeyChoicesSidebar = (props: KeyChoicesSidebarProps) => {
  // Preview (ProToolGuard): nothing is filled, so there is no readout to show.
  const readOnly = useToolReadOnly();
  return readOnly ? null : <KeyChoicesReadout {...props} />;
};

function KeyChoicesReadout({ sections, mode = "floating" }: KeyChoicesSidebarProps) {
  const rail = useToolRail();
  const node = useRailSlot("readout");

  // Inside a tool page: the rail's Readout tab.
  if (rail) return node ? createPortal(<ReadoutContent sections={sections} />, node) : null;

  const panel = (
    <GlassPanel className="p-3 max-h-[70vh] overflow-y-auto w-56 sf-sb">
      <h4 className="font-heading text-sf-eyebrow uppercase text-t4 mb-3">Readout</h4>
      <ReadoutContent sections={sections} />
    </GlassPanel>
  );
  if (mode === "inline") return panel;
  return <div className="fixed left-4 top-1/2 -translate-y-1/2 hidden xl:block z-40 no-print">{panel}</div>;
}

export default KeyChoicesSidebar;

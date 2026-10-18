/**
 * SimulatorCascadeFooter: the tool pages' CascadeFooter, for simulators.
 *
 * Simulator pages are a full-height iframe, not ToolPageLayout, so they never
 * showed what they build on or feed into. This places the same CascadeFooter
 * (same data, tool-wiki-data buildsOn / feedsInto) below the simulator
 * viewport, inside the tool-content measure.
 */
import { CascadeFooter } from "@/components/tools/CascadeFooter";

export function SimulatorCascadeFooter({ simulatorType }: { simulatorType: string }): JSX.Element {
  return (
    <div className="sf-tool-content pb-16">
      <CascadeFooter toolType={simulatorType} />
    </div>
  );
}

export default SimulatorCascadeFooter;

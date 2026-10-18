/**
 * SimRunExportButton: export the current simulation run as Markdown or PDF.
 *
 * Simulators were the one family of tools with no export. This reuses the
 * tool pages' ExportDialog: the PDF tab prints SimRunReportTemplate, the
 * Text tab writes the same report as Markdown, and JSON/Word/CSV/Notion fall
 * through to the dialog's generic paths over the raw payload.
 *
 * The report is built from the payload Save and Publish already read, after
 * asking the simulator for its live state, so an export never prints a stale
 * snapshot.
 */
import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportDialog from "@/components/tools/ExportDialog";
import { SimRunReportTemplate } from "@/lib/pdf/templates";
import {
  buildSimRunReport,
  simRunReportToMarkdown,
  SIMULATOR_NAMES,
} from "@/lib/simulators/run-report";
import type { SimulatorPayload } from "@/hooks/use-simulation-save";

interface SimRunExportButtonProps {
  simulatorType: string;
  payload: SimulatorPayload | null;
  /** Ask the simulator for its live state (useSimulationSave's refreshPayload). */
  refreshPayload?: () => void;
  narrativeNotes?: Record<string, string>;
  worldName?: string;
  className?: string;
}

export function SimRunExportButton({
  simulatorType,
  payload,
  refreshPayload,
  narrativeNotes,
  worldName,
  className,
}: SimRunExportButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const report = useMemo(
    () => buildSimRunReport({ simulatorType, payload, worldName, narrativeNotes }),
    [simulatorType, payload, worldName, narrativeNotes],
  );
  const simName = SIMULATOR_NAMES[simulatorType] ?? simulatorType;
  const slug = (report.runName || "run").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          refreshPayload?.();
          setOpen(true);
        }}
        className={
          className ??
          "bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.12] hover:text-t1 text-[13px] uppercase tracking-wider min-h-hit px-3"
        }
      >
        <FileDown className="w-3 h-3 mr-1" />
        Export
      </Button>
      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        toolName={simName}
        worldName={worldName}
        worksheetTitle={report.runName || undefined}
        formState={payload ?? { parameters: {}, results: {} }}
        summaryTemplate={<SimRunReportTemplate report={report} worldName={worldName} />}
        markdown={() => simRunReportToMarkdown(report)}
        defaultFilename={`${simulatorType}-${slug || "run"}`}
      />
    </>
  );
}

export default SimRunExportButton;

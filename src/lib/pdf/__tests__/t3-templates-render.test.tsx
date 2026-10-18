import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import SimRunReportTemplate from "../templates/SimRunReportTemplate";
import DossierFullReportTemplate from "../templates/DossierFullReportTemplate";
import SurfaceGazetteerTemplate from "../templates/SurfaceGazetteerTemplate";
import { buildSimRunReport } from "@/lib/simulators/run-report";
import { buildGazetteerReport } from "@/lib/surface-cartographer/places";
import { createEmptyDossier } from "@/lib/dossier/types";

// A 1x1 PNG: enough to prove the map-sheet image path renders.
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const isPdf = (buf: Buffer) => buf.subarray(0, 5).toString("latin1") === "%PDF-";

describe("new PDF templates render", () => {
  it("SimRunReportTemplate", async () => {
    const report = buildSimRunReport({
      simulatorType: "tidelock",
      payload: { name: "Ashgrave", parameters: { orbitalDistance: 0.07 }, results: { tSSP: 391, tASP: 61, tTerm: 288 } },
      narrativeNotes: { ring: "Moss cities." },
    });
    const buf = await renderToBuffer(<SimRunReportTemplate report={report} worldName="Kethra" />);
    expect(isPdf(buf)).toBe(true);
  }, 30000);

  it("DossierFullReportTemplate", async () => {
    const d = createEmptyDossier();
    d.identity.name = "Ilse Varo";
    d.resolved = { lifespan: "140 years" };
    d.provenance = { lifespan: "evolutionary-biology" };
    d.generalNotes = "Long notes. ".repeat(400);
    const buf = await renderToBuffer(
      <DossierFullReportTemplate formState={d as unknown as Record<string, unknown>} worldName="Kethra" />,
    );
    expect(isPdf(buf)).toBe(true);
  }, 30000);

  it("SurfaceGazetteerTemplate, with and without a map image", async () => {
    const report = buildGazetteerReport(
      "Kellis",
      [{ place: { id: "a", name: "Vel Haran", placeType: "city", description: "Salt city.", at: { lat: 1, lon: 2 } } }],
      { radiusKm: 7000, locked: false, substellarLon: 0 },
    );
    expect(isPdf(await renderToBuffer(<SurfaceGazetteerTemplate report={report} mapImage={PIXEL} />))).toBe(true);
    expect(isPdf(await renderToBuffer(<SurfaceGazetteerTemplate report={report} mapImage={null} />))).toBe(true);
  }, 30000);
});

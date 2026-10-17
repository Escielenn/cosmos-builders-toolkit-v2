import { describe, expect, it } from "vitest";
import {
  ENTITY_MASTER_FIELDS,
  readMasterField,
  withMasterFieldAliases,
} from "@/lib/entity-config";
import { prepopulateWorksheetData } from "@/lib/entity-prepopulate";
import { extractWorksheetFacts } from "@/lib/worksheet-facts";

const mythBodyPlan = ENTITY_MASTER_FIELDS.mythology.find((f) => f.label === "Body Plan")!;
const speciesBodyPlan = ENTITY_MASTER_FIELDS.species.find((f) => f.label === "Body Plan")!;

describe("bodyPlan key collision", () => {
  it("gives the mythology and species body plans distinct keys", () => {
    expect(speciesBodyPlan.key).toBe("bodyPlan");
    expect(mythBodyPlan.key).toBe("mythBodyPlan");
    expect(mythBodyPlan.key).not.toBe(speciesBodyPlan.key);
  });

  it("surfaces the xenomythology body plan as its own fact", () => {
    const facts = extractWorksheetFacts("xenomythology-framework-builder", {
      physicalForm: { bodyPlan: "radial" },
    });
    expect(facts.find((f) => f.key === "mythBodyPlan")?.value).toBe("radial");
    expect(facts.find((f) => f.key === "bodyPlan")).toBeUndefined();
  });
});

describe("legacy key reads", () => {
  it("reads a mythology body plan stored under the old key", () => {
    expect(readMasterField({ bodyPlan: "radial" }, mythBodyPlan)).toBe("radial");
  });

  it("prefers the current key over the legacy one", () => {
    expect(readMasterField({ bodyPlan: "old", mythBodyPlan: "new" }, mythBodyPlan)).toBe("new");
  });

  it("does not give the species field a legacy fallback", () => {
    expect(readMasterField({ mythBodyPlan: "radial" }, speciesBodyPlan)).toBeUndefined();
  });

  it("fills the current key for display and keeps the legacy key", () => {
    const out = withMasterFieldAliases("mythology", { bodyPlan: "radial" });
    expect(out.mythBodyPlan).toBe("radial");
    expect(out.bodyPlan).toBe("radial");
  });

  it("prepopulates the xenomythology worksheet from legacy mythology data", () => {
    const data = prepopulateWorksheetData({ bodyPlan: "spiral" }, "mythology", "xenomythology-framework-builder");
    expect(data).toEqual({ physicalForm: { bodyPlan: "spiral" } });
  });
});

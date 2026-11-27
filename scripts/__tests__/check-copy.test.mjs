import { describe, it, expect } from "vitest";
import { findViolations, stripComments } from "../check-copy.mjs";

const ids = (src) => findViolations(src).map((h) => h.id);

describe("check-copy", () => {
  it("flags jargon in JSX text and string literals", () => {
    expect(ids(`<Button>Begin survey</Button>`)).toEqual(["begin survey"]);
    expect(ids(`const t = "INITIALIZE EMPTY";`)).toEqual(["initialize empty"]);
    expect(ids(`title="Personnel file"`).sort()).toEqual(["personnel", "personnel file"]);
    expect(ids(`<p>\n  NO DATA ON FILE.\n</p>`).sort()).toEqual(["no data on file", "on file"]);
    expect(ids(`label: "Designation"`)).toEqual(["designation"]);
  });

  it("flags filler words", () => {
    expect(ids(`<p>Seamlessly dive into your world and unlock it.</p>`).sort()).toEqual(["dive into", "seamless", "unlock"]);
    expect(ids("const s = `Whether you're new or not`;")).toEqual(["whether you're"]);
    expect(ids(`"It's not just a tool"`)).toEqual(["it's not just"]);
  });

  it("flags the 1.8 AI-speak list", () => {
    expect(ids(`<p>NO ENTRIES ON FILE.</p>`)).toEqual(["on file"]);
    expect(ids(`<Loader message="INITIALIZING ROGUE" />`)).toEqual(["initializing"]);
    expect(ids(`placeholder="Personnel notes..."`)).toEqual(["personnel"]);
    expect(ids(`content: "CLEARANCE: LEVEL 3"`)).toEqual(["clearance"]);
    expect(ids(`label: "Curated"`)).toEqual(["curated"]);
    expect(ids(`<p>Empower your writing and leverage the cascade.</p>`).sort()).toEqual(["empower", "leverage"]);
    expect(ids(`"A rich tapestry of worlds"`)).toEqual(["tapestry"]);
    expect(ids(`"Delve into cutting-edge science"`).sort()).toEqual(["cutting-edge", "delve"]);
    expect(ids(`"Embark on a voyage"`)).toEqual(["embark"]);
    expect(ids(`"In today's world, tools revolutionize writing"`).sort()).toEqual(["in today's world", "revolutionize"]);
    expect(ids(`"Harness the power of physics and unleash a robust world"`).sort()).toEqual(["harness the power", "robust", "unleash"]);
    expect(ids(`"The ship isn't just a vehicle, it's a home"`)).toEqual([]);
    expect(ids(`"Ships are not just vehicles, they're homes"`)).toEqual(["not just X, but Y"]);
    expect(ids(`"It shapes not only technology, but people"`)).toEqual(["not just X, but Y"]);
  });

  it("leaves literal and physical uses alone", () => {
    expect(ids(`"Safety harnesses recommended during thrust"`)).toEqual([]);
    expect(ids(`"A journey measured in seasons"`)).toEqual([]);
    expect(ids(`"Every worksheet, not just simulators, can now be attached"`)).toEqual([]);
    expect(ids(`"Commencement Bay"`)).toEqual([]);
  });

  it("ignores identifiers, class names, comments and values", () => {
    expect(ids(`source: "curated"`)).toEqual([]);
    expect(ids(`<h2 className="sf-clearance-title">Pro</h2>`)).toEqual([]);
    expect(ids(`{ id: "empowers-state" }`)).toEqual([]);
    expect(ids(`import { Unlock } from "lucide-react";`)).toEqual([]);
    expect(ids(`<div className="bg-sf-surface-elevated" />`)).toEqual([]);
    expect(ids(`onInitializeEmpty={handleCreate}`)).toEqual([]);
    expect(ids(`// BEGIN SURVEY used to be here\nconst x = 1;`)).toEqual([]);
    expect(ids(`{/* Begin survey */}`)).toEqual([]);
    expect(ids(`<ReadoutRow label="Class" value={star.designation} />`)).toEqual([]);
    expect(ids(`const url = "https://example.com"; // unlock`)).toEqual([]);
  });

  it("keeps line numbers when stripping comments", () => {
    const src = `/* a\nb */\nconst x = "Begin survey";`;
    expect(stripComments(src).split("\n")).toHaveLength(3);
    expect(findViolations(src)[0].line).toBe(3);
  });
});

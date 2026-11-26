import { describe, it, expect } from "vitest";
import { findViolations, stripComments } from "../check-copy.mjs";

const ids = (src) => findViolations(src).map((h) => h.id);

describe("check-copy", () => {
  it("flags jargon in JSX text and string literals", () => {
    expect(ids(`<Button>Begin survey</Button>`)).toEqual(["begin survey"]);
    expect(ids(`const t = "INITIALIZE EMPTY";`)).toEqual(["initialize empty"]);
    expect(ids(`title="Personnel file"`)).toEqual(["personnel file"]);
    expect(ids(`<p>\n  NO DATA ON FILE.\n</p>`)).toEqual(["no data on file"]);
    expect(ids(`label: "Designation"`)).toEqual(["designation"]);
  });

  it("flags filler words", () => {
    expect(ids(`<p>Seamlessly dive into your world and unlock it.</p>`).sort()).toEqual(["dive into", "seamless", "unlock"]);
    expect(ids("const s = `Whether you're new or not`;")).toEqual(["whether you're"]);
    expect(ids(`"It's not just a tool"`)).toEqual(["it's not just"]);
  });

  it("ignores identifiers, class names, comments and values", () => {
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

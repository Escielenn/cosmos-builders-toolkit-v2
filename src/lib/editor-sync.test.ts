import { describe, expect, it } from "vitest";
import { decideExternalContent } from "./editor-sync";
import { exportAuthor } from "./writing/export-author";

const base = {
  incoming: "<p>server</p>",
  lastIncoming: "<p>server</p>",
  editorHtml: "<p>server</p>",
  syncedHtml: "<p>server</p>",
  focused: false,
};

describe("decideExternalContent", () => {
  it("in-sync when the editor already shows the incoming copy (a save echo)", () => {
    expect(
      decideExternalContent({ ...base, incoming: "<p>typed</p>", editorHtml: "<p>typed</p>" }),
    ).toBe("in-sync");
  });

  it("skips a prop that has not changed", () => {
    expect(decideExternalContent({ ...base, editorHtml: "<p>typed</p>" })).toBe("skip");
  });

  it("never puts an older refetch over unsaved local edits (the stale-overwrite race)", () => {
    // Saved A, kept typing to B, the refetch of A lands while unfocused.
    expect(
      decideExternalContent({
        incoming: "<p>A</p>",
        lastIncoming: "<p></p>",
        editorHtml: "<p>A B</p>",
        syncedHtml: "<p></p>",
        focused: false,
      }),
    ).toBe("skip");
  });

  it("applies a genuinely new outside copy when there are no local edits", () => {
    expect(
      decideExternalContent({ ...base, incoming: "<p>remote</p>" }),
    ).toBe("apply");
    // A form reset to empty after its text was handed over.
    expect(
      decideExternalContent({
        incoming: "",
        lastIncoming: "<p>hi</p>",
        editorHtml: "<p>hi</p>",
        syncedHtml: "<p>hi</p>",
        focused: false,
      }),
    ).toBe("apply");
  });

  it("defers while the writer is in the editor", () => {
    expect(decideExternalContent({ ...base, incoming: "<p>remote</p>", focused: true })).toBe("defer");
  });

  it("handles the first evaluation (no previous prop)", () => {
    expect(
      decideExternalContent({ ...base, lastIncoming: null, syncedHtml: null, incoming: "<p>x</p>" }),
    ).toBe("apply");
  });
});

describe("exportAuthor", () => {
  it("prefers the profile display name", () => {
    expect(exportAuthor("  Jane Doe ", { display_name: "Other" })).toBe("Jane Doe");
  });
  it("falls back to sign-up metadata, never Unknown Author", () => {
    expect(exportAuthor(null, { full_name: "J. Doe" })).toBe("J. Doe");
    expect(exportAuthor("", {})).toBe("Anonymous");
    expect(exportAuthor(undefined, undefined)).toBe("Anonymous");
  });
});

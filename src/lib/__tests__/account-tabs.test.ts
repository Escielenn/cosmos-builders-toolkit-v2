import { describe, expect, it } from "vitest";
import { accountTabHref, parseAccountTab } from "../account-tabs";

describe("account tabs", () => {
  it("parses known tabs and defaults to the personnel file", () => {
    expect(parseAccountTab("collection")).toBe("collection");
    expect(parseAccountTab("archive")).toBe("archive");
    expect(parseAccountTab(null)).toBe("file");
    expect(parseAccountTab("billing")).toBe("file");
  });

  it("round-trips through the URL the /collection and /archive redirects use", () => {
    expect(accountTabHref("collection")).toBe("/profile?tab=collection");
    expect(accountTabHref("archive")).toBe("/profile?tab=archive");
    expect(accountTabHref("file")).toBe("/profile");
  });
});

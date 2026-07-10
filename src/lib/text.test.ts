import { describe, it, expect } from "vitest";
import { countWords } from "@/lib/text";

describe("text helpers (streaks + continue-card)", () => {
  it("counts words in plain and HTML content", () => {
    expect(countWords("<p>one two three</p>")).toBe(3);
    expect(countWords("<h1>Title</h1><p>a b c d</p>")).toBe(5);
    expect(countWords("word&nbsp;spaced")).toBe(2);
  });
  it("returns 0 for empty/blank/null", () => {
    expect(countWords("")).toBe(0);
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
    expect(countWords("<p></p>")).toBe(0);
    expect(countWords("   <br/>  ")).toBe(0);
  });
  it("collapses tags without merging adjacent words", () => {
    // "<strong>a</strong><em>b</em>" -> tags become spaces -> "a b" -> 2
    expect(countWords("<strong>a</strong> <em>b</em>")).toBe(2);
  });
});

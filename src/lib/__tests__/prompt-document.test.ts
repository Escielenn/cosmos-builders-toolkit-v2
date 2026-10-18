import { describe, expect, it } from "vitest";
import { isWorkshopFolder, promptDocumentSeed } from "@/lib/writing/prompt-document";
import { readDocMeta } from "@/lib/document-meta";

const prompt = {
  id: "wp-001",
  title: "The Last Transmission",
  prompt: "A signal arrives from a ship that left three centuries ago.",
  category: "scene" as const,
  difficulty: "beginner" as const,
  wordGoal: 500,
};

describe("promptDocumentSeed", () => {
  const seed = promptDocumentSeed(prompt, "2026-10-18");

  it("never puts the prompt in the prose", () => {
    expect(seed.content).toBe("");
  });

  it("puts the prompt in the synopsis, notes and word target", () => {
    const meta = readDocMeta(seed.metadata);
    expect(meta.synopsis).toBe(prompt.prompt);
    expect(meta.notes).toContain("Daily prompt: The Last Transmission");
    expect(meta.notes).toContain("Started 2026-10-18");
    expect(meta.target).toBe(500);
    expect(seed.metadata.workshop).toEqual({ promptId: "wp-001" });
    expect(seed.title).toBe("The Last Transmission");
  });

  it("no word goal, no target", () => {
    const meta = readDocMeta(promptDocumentSeed({ ...prompt, wordGoal: undefined }, "2026-10-18").metadata);
    expect(meta.target).toBe(0);
    expect(meta.notes).not.toContain("Word goal");
  });
});

describe("isWorkshopFolder", () => {
  it("matches only the marked folder", () => {
    expect(isWorkshopFolder({ entry_type: "folder", metadata: { workshopFolder: true } })).toBe(true);
    expect(isWorkshopFolder({ entry_type: "folder", metadata: {} })).toBe(false);
    expect(isWorkshopFolder({ entry_type: "document", metadata: { workshopFolder: true } })).toBe(false);
  });
});

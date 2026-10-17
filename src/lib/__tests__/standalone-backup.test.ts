import { describe, expect, it, vi } from "vitest";
import { isStandaloneSave, writeStandaloneBackup } from "@/lib/standalone-backup";

function fakeStorage() {
  return { setItem: vi.fn() };
}

describe("writeStandaloneBackup", () => {
  it("writes the backup when no world is open", () => {
    const storage = fakeStorage();
    const wrote = writeStandaloneBackup("pcm-worksheet", { a: 1 }, { worldId: null, signedIn: true }, storage);
    expect(wrote).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith("pcm-worksheet", JSON.stringify({ a: 1 }));
  });

  it("does not write while a world is open and the user is signed in", () => {
    const storage = fakeStorage();
    const wrote = writeStandaloneBackup("pcm-worksheet", { a: 1 }, { worldId: "w-1", signedIn: true }, storage);
    expect(wrote).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("keeps the browser copy when there is no signed-in user to save the world to", () => {
    const storage = fakeStorage();
    expect(writeStandaloneBackup("k", {}, { worldId: "w-1", signedIn: false }, storage)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledOnce();
  });

  it("never removes anything from storage", () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    writeStandaloneBackup("k", {}, { worldId: "w-1", signedIn: true }, storage);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});

describe("isStandaloneSave", () => {
  it("is false only for a signed-in world session", () => {
    expect(isStandaloneSave({ worldId: "w", signedIn: true })).toBe(false);
    expect(isStandaloneSave({ worldId: undefined, signedIn: true })).toBe(true);
    expect(isStandaloneSave({ worldId: "", signedIn: true })).toBe(true);
    expect(isStandaloneSave({ worldId: "w", signedIn: false })).toBe(true);
  });
});

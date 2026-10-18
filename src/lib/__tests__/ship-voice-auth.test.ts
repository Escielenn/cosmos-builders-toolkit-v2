import { describe, expect, it } from "vitest";
import { mapError, VOICE } from "../ship-voice";
import { joinCommentAuthors } from "@/hooks/use-world-comments";

describe("mapError, auth errors", () => {
  it("maps Supabase Auth codes", () => {
    expect(mapError({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe(VOICE.credentialsRejected);
    expect(mapError({ code: "user_already_exists", message: "User already registered" })).toBe(VOICE.accountExists);
    expect(mapError({ code: "over_email_send_rate_limit", message: "x" })).toBe(VOICE.rateLimited);
    expect(mapError({ code: "same_password", message: "x" })).toBe(VOICE.samePassword);
  });

  it("maps legacy code-less messages", () => {
    expect(mapError(new Error("Invalid login credentials"))).toBe(VOICE.credentialsRejected);
    expect(mapError({ message: "User already registered" })).toBe(VOICE.accountExists);
    expect(mapError("Email not confirmed")).toBe(VOICE.emailUnconfirmed);
  });

  it("keeps PostgREST codes and generic reshaping", () => {
    expect(mapError({ code: "23505", message: "dup" })).toBe(VOICE.recordConflict);
    expect(mapError(new Error("Something broke!"))).toBe("SOMETHING BROKE.");
  });
});

describe("joinCommentAuthors", () => {
  const row = (id: string, user_id: string) => ({
    id, world_id: "w", user_id, content: `c-${id}`, created_at: "2026-10-18T00:00:00Z",
  });

  it("attaches names and avatars, falling back to Anonymous", () => {
    const out = joinCommentAuthors(
      [row("1", "u1"), row("2", "u2"), row("3", "u3")],
      [
        { user_id: "u1", display_name: "Ada", avatar_url: "https://a/p.png" },
        { user_id: "u2", display_name: null, avatar_url: null },
      ],
    );
    expect(out.map((c) => [c.content, c.display_name, c.avatar_url])).toEqual([
      ["c-1", "Ada", "https://a/p.png"],
      ["c-2", "Anonymous", null],
      ["c-3", "Anonymous", null],
    ]);
  });
});

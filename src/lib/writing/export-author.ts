// The byline on an exported document: the writer's profile display name,
// then the name their sign-up carried. Never "Unknown Author".

export function exportAuthor(
  profileName: string | null | undefined,
  userMetadata: Record<string, unknown> | null | undefined,
): string {
  const candidates = [profileName, userMetadata?.display_name, userMetadata?.full_name, userMetadata?.name];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "Anonymous";
}

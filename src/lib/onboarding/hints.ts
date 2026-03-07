export const HINT_PREFIX = "sf-hint-";

export interface HintDef {
  id: string;
  copy: string;
  variant: "default" | "warning" | "compact";
}

export const HINTS: Record<string, HintDef> = {
  "wiki-links": {
    id: "wiki-links",
    copy: "CROSS-REFERENCE PROTOCOL: Type [[ in the editor to link this entry to any other element in your world. Links become navigable connections.",
    variant: "default",
  },
  "connection-suggestions": {
    id: "connection-suggestions",
    copy: "CONNECTION DETECTED: Wiki-links generate connection suggestions. Accept to register a formal link in your world graph. Dismiss to skip.",
    variant: "default",
  },
  codex: {
    id: "codex",
    copy: "CODEX ACTIVE: This panel indexes all world elements across cascade layers. Click entries to navigate. Use the view toggle below to set Wiki or Tool mode.",
    variant: "compact",
  },
  chronicle: {
    id: "chronicle",
    copy: "CHRONICLE INITIALIZED: Log events, eras, and sub-events to build a vertical timeline. Gap detection flags temporal lacunae automatically.",
    variant: "default",
  },
  tags: {
    id: "tags",
    copy: "CLASSIFICATION SYSTEM: Tags are shared across all worlds. Type to search existing tags or create new ones.",
    variant: "default",
  },
  "data-profile": {
    id: "data-profile",
    copy: "DATA PROFILE: Auto-generated from your tool parameters. Edit the source worksheet to update these values.",
    variant: "default",
  },
  "dead-links": {
    id: "dead-links",
    copy: "DEAD LINK DETECTED: Strikethrough links reference deleted entries. Edit to remove or redirect them. Backlinks below show which pages reference this entry.",
    variant: "warning",
  },
  "default-view": {
    id: "default-view",
    copy: "VIEW MODE: Tool mode opens the worksheet editor. Wiki mode opens the encyclopedia page. Set your default below.",
    variant: "compact",
  },
  collaboration: {
    id: "collaboration",
    copy: "LINK SHARING: Toggle to generate a public read-only link. Pro users can invite collaborators with editor or viewer roles.",
    variant: "default",
  },
};

export function isHintDismissed(id: string): boolean {
  try {
    return localStorage.getItem(HINT_PREFIX + id) === "true";
  } catch {
    return true;
  }
}

export function dismissHint(id: string): void {
  try {
    localStorage.setItem(HINT_PREFIX + id, "true");
  } catch {}
}

export function resetAllHints(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(HINT_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

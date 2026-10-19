// The profile's tabs. /collection and /archive used to be standalone pages
// reachable only from the account menu; they are tabs here now and the old
// paths redirect (see App.tsx).

export const ACCOUNT_TABS = [
  { id: "file", label: "Personnel file" },
  { id: "collection", label: "Collection" },
  { id: "archive", label: "Archive" },
] as const;

export type AccountTab = (typeof ACCOUNT_TABS)[number]["id"];

export function parseAccountTab(value: string | null | undefined): AccountTab {
  return ACCOUNT_TABS.some((t) => t.id === value) ? (value as AccountTab) : "file";
}

/** The profile URL for a tab ("file" is the bare /profile). */
export function accountTabHref(tab: AccountTab): string {
  return tab === "file" ? "/profile" : `/profile?tab=${tab}`;
}

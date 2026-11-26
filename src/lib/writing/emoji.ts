// ---------------------------------------------------------------------------
// A compact marker set (1.7).
//
// Document markers are the writer's own emoji. The system keyboard has every
// emoji there is (the picker's field takes any of them); this list is only a
// quick, searchable shelf of the ones a manuscript tends to want, grouped the
// way a writer thinks about scenes. About 4 KB, no dataset, no dependency.
// Each entry: emoji, then the words it answers to.
// ---------------------------------------------------------------------------

export interface MarkerGroup {
  id: string;
  name: string;
  items: [emoji: string, words: string][];
}

export const MARKER_GROUPS: MarkerGroup[] = [
  {
    id: "state",
    name: "State",
    items: [
      ["📌", "pin todo to do"],
      ["🛠️", "tools in progress working fix"],
      ["✍️", "writing draft hand"],
      ["✅", "done final check complete"],
      ["🔁", "revise again loop rewrite"],
      ["✂️", "cut trim scissors"],
      ["❓", "question unsure"],
      ["❗", "important attention"],
      ["⭐", "star favourite favorite key"],
      ["🔥", "fire hot urgent climax"],
      ["💤", "sleep parked later"],
      ["🚧", "construction rough blocked"],
      ["🔒", "locked final frozen"],
      ["🧪", "experiment test try"],
      ["🗑️", "trash cut remove"],
      ["📎", "clip note reference attachment"],
    ],
  },
  {
    id: "story",
    name: "Story",
    items: [
      ["🎬", "scene opening action start"],
      ["🚪", "door entrance arrival exit"],
      ["⚔️", "fight battle conflict swords"],
      ["💔", "heartbreak loss betrayal"],
      ["❤️", "love heart romance"],
      ["💀", "death skull danger"],
      ["👁️", "eye pov watch reveal"],
      ["🗝️", "key secret clue"],
      ["🎭", "mask drama deception theatre"],
      ["💬", "dialogue talk speech"],
      ["🤝", "deal alliance meeting handshake"],
      ["🕯️", "candle vigil memory quiet"],
      ["⏳", "time hourglass waiting deadline"],
      ["🔮", "prophecy future vision crystal"],
      ["📜", "scroll history lore record"],
      ["🏁", "finish ending end flag"],
      ["🌀", "twist turn spiral"],
      ["⚖️", "choice judgement balance law"],
      ["🎯", "goal target aim"],
      ["🧩", "puzzle piece mystery"],
    ],
  },
  {
    id: "worlds",
    name: "Worlds",
    items: [
      ["🌒", "moon crescent night phase"],
      ["🌕", "full moon"],
      ["🌍", "earth planet world home"],
      ["🪐", "planet rings saturn gas giant"],
      ["☄️", "comet impact"],
      ["⭐", "star sun"],
      ["🌌", "galaxy milky way deep space"],
      ["☀️", "sun star day dayside"],
      ["🌑", "new moon dark nightside"],
      ["🚀", "rocket ship launch voyage"],
      ["🛰️", "satellite orbit station probe"],
      ["🛸", "saucer alien craft contact"],
      ["👽", "alien species other"],
      ["🤖", "robot machine ai mind"],
      ["🧬", "dna biology life gene"],
      ["⚛️", "atom physics science"],
      ["🔭", "telescope survey observe"],
      ["📡", "antenna signal comms dish"],
      ["🧭", "compass navigation direction traverse"],
      ["🗺️", "map place territory"],
    ],
  },
  {
    id: "places",
    name: "Places",
    items: [
      ["🏔️", "mountain ridge summit"],
      ["🌋", "volcano eruption"],
      ["🏜️", "desert dunes waste"],
      ["🌊", "wave sea ocean tide"],
      ["🧊", "ice cold core frozen"],
      ["🌲", "forest tree wild"],
      ["🏙️", "city skyline settlement"],
      ["🏛️", "temple hall institution myth"],
      ["🏠", "home house shelter"],
      ["⛺", "camp tent outpost"],
      ["🏭", "factory industry forge"],
      ["⚓", "anchor port harbor harbour"],
      ["🌫️", "fog mist haze"],
      ["⛈️", "storm thunder weather"],
      ["❄️", "snow winter cold"],
      ["🌅", "sunrise dawn terminator"],
    ],
  },
  {
    id: "people",
    name: "People",
    items: [
      ["🧑‍🚀", "astronaut crew pilot"],
      ["🧑‍🔬", "scientist researcher"],
      ["🧙", "mage elder mentor"],
      ["👑", "crown ruler queen king power"],
      ["🛡️", "shield guard protector"],
      ["🗡️", "dagger assassin threat"],
      ["🕵️", "spy detective investigator"],
      ["👥", "group ensemble crowd"],
      ["👤", "person stranger figure"],
      ["🧒", "child young"],
      ["🐉", "dragon beast creature"],
      ["🐺", "wolf predator pack"],
      ["🦉", "owl wisdom night"],
      ["👻", "ghost haunting memory"],
    ],
  },
  {
    id: "notes",
    name: "Notes",
    items: [
      ["📝", "note memo jot"],
      ["📚", "books research reading"],
      ["🔬", "microscope research detail"],
      ["💡", "idea bulb insight"],
      ["🧠", "brain mind psychology"],
      ["🗓️", "calendar timeline date"],
      ["🔗", "link connection thread"],
      ["🏷️", "tag label name"],
      ["📷", "photo image reference"],
      ["🎵", "music song mood"],
      ["🧵", "thread subplot strand"],
      ["📦", "box archive stored"],
    ],
  },
];

const ALL: [string, string][] = MARKER_GROUPS.flatMap((g) => g.items);

/** Markers whose words contain every term typed. Empty query: nothing (show the groups). */
export function searchMarkers(query: string, limit = 48): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const out: string[] = [];
  for (const [emoji, words] of ALL) {
    if (terms.every((t) => words.includes(t)) && !out.includes(emoji)) out.push(emoji);
    if (out.length >= limit) break;
  }
  return out;
}

export const RECENT_MARKERS_KEY = "sf-writing-markers-recent:v1";
export const MAX_RECENT_MARKERS = 12;

/** Most recent first, no repeats, capped. */
export function pushRecentMarker(recent: readonly string[], marker: string): string[] {
  const m = marker.trim();
  if (!m) return [...recent];
  return [m, ...recent.filter((r) => r !== m)].slice(0, MAX_RECENT_MARKERS);
}

export function sanitizeRecentMarkers(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t || t.length > 32 || out.includes(t)) continue;
    out.push(t);
    if (out.length >= MAX_RECENT_MARKERS) break;
  }
  return out;
}

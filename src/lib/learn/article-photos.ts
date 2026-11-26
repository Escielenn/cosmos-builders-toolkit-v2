// ---------------------------------------------------------------------------
// Article photographs for SF University, from Unsplash.
//
// The CMS carries no usable cover images (the old ones were book and film art,
// a rights risk), so 1.6 drew a generated cover for every article. 1.7 adds
// real photography on top of that: each article gets one photograph of a real
// place or thing that fits its subject, and the generated cover stays as the
// fallback when a photo cannot load.
//
// Unsplash's API guidelines are followed here, in one place:
//   - HOTLINK. Images are served from images.unsplash.com with size params
//     (w, h, q, auto=format, fit=crop); nothing is copied into the repo. The
//     `ixid` each photo was returned with is kept on every URL.
//   - CREDIT. Every surface that shows a photo shows "Photo: <name> /
//     Unsplash", linking the photographer and the photo page with
//     `?utm_source=stellarforge&utm_medium=referral`.
//   - DOWNLOAD TRACKING. Each photo below had its download endpoint triggered
//     when it was selected (2026-11-25).
//
// Selection rules: real photography only. No artwork reproductions, no book
// or film covers, no identifiable people, no logos.
//
// To add an article: add a `{ prefix, photo }` row to ARTICLE_PHOTOS. An
// article with no row still gets a fitting photo: one is picked from its
// category's pool, seeded by slug, so the same article always shows the same
// photograph on every surface.
// ---------------------------------------------------------------------------

export interface ArticlePhoto {
  /** Unsplash photo id. */
  id: string;
  /** Hotlink base on images.unsplash.com. Add size params with photoSrc(). */
  url: string;
  /** What is in the picture, for people who cannot see it. */
  alt: string;
  photographer: string;
  /** The photographer's Unsplash profile, with referral params. */
  photographerUrl: string;
  /** The photo's page on Unsplash, with referral params. */
  photoUrl: string;
  /** Intrinsic size of the original, in pixels. */
  width: number;
  height: number;
}

const REFERRAL = "utm_source=stellarforge&utm_medium=referral";

/** Unsplash itself, for the "/ Unsplash" half of a credit. */
export const UNSPLASH_URL = `https://unsplash.com/?${REFERRAL}`;

interface PhotoSeed {
  id: string;
  file: string;
  ixid: string;
  width: number;
  height: number;
  photographer: string;
  username: string;
  page: string;
  alt: string;
}

function photo(seed: PhotoSeed): ArticlePhoto {
  return {
    id: seed.id,
    url: `https://images.unsplash.com/${seed.file}?ixid=${seed.ixid}&ixlib=rb-4.1.0`,
    alt: seed.alt,
    photographer: seed.photographer,
    photographerUrl: `https://unsplash.com/@${seed.username}?${REFERRAL}`,
    photoUrl: `https://unsplash.com/photos/${seed.page}?${REFERRAL}`,
    width: seed.width,
    height: seed.height,
  };
}

const PHOTOS = {
  chalkboard: photo({
    id: "OPpCbAAKWv8",
    file: "photo-1635372722656-389f87a941b7",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8MXx8Y2hhbGtib2FyZCUyMGVxdWF0aW9uc3xlbnwwfDB8fHwxNzk1Njc2MzIyfDI",
    width: 4000,
    height: 2252,
    photographer: "Thomas T",
    username: "pyssling240",
    page: "a-blackboard-with-a-lot-of-writing-on-it-OPpCbAAKWv8",
    alt: "A blackboard covered edge to edge in chalked equations and diagrams.",
  }),
  vlaDawn: photo({
    id: "Wj1D-qiOseE",
    file: "photo-1526666923127-b2970f64b422",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8MXx8cmFkaW8lMjB0ZWxlc2NvcGUlMjBhcnJheXxlbnwwfDB8fHwxNzk1Njc2MzIxfDI",
    width: 4928,
    height: 3280,
    photographer: "Donald Giannatti",
    username: "wizwow",
    page: "gray-satellite-disc-on-field-Wj1D-qiOseE",
    alt: "A radio telescope dish on the New Mexico plain under a deep blue sky at dawn.",
  }),
  jellyfish: photo({
    id: "MYadhrkenNg",
    file: "photo-1508311603478-ce574376c3cf",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8MXx8ZGVlcCUyMHNlYSUyMGplbGx5ZmlzaHxlbnwwfDB8fHwxNzk1Njc2MzI0fDI",
    width: 3800,
    height: 2533,
    photographer: "Marat Gilyadzinov",
    username: "m3design",
    page: "closeup-photography-of-swarm-of-jellyfish-MYadhrkenNg",
    alt: "A swarm of translucent moon jellyfish drifting through dark water.",
  }),
  blackSand: photo({
    id: "ea4FS8zIsqE",
    file: "photo-1682547094948-1d764fc412ce",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8NHx8aWNlbGFuZCUyMHZvbGNhbmljJTIwbGFuZHNjYXBlfGVufDB8MHx8fDE3OTU2NzYzMjd8Mg",
    width: 5916,
    height: 3944,
    photographer: "David Becker",
    username: "beckerworks",
    page: "the-sun-is-setting-over-a-mountain-range-ea4FS8zIsqE",
    alt: "Jagged mountains above a black sand shore in Iceland, with low sun catching the peaks.",
  }),
  badlands: photo({
    id: "XpAFtjJEMeU",
    file: "photo-1510940402025-b2c518ff4085",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8NXx8YXRhY2FtYSUyMGRlc2VydHxlbnwwfDB8fHwxNzk1Njc2MzI3fDI",
    width: 4912,
    height: 2760,
    photographer: "Bailey Hall",
    username: "baileyelisehall",
    page: "rock-formation-under-white-sky-XpAFtjJEMeU",
    alt: "Red eroded ridges and a pale dune in the Atacama Desert, bare of any plant life.",
  }),
  anemones: photo({
    id: "4uu9DCL6vTY",
    file: "photo-1762733717755-e5cf9086fcfe",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8M3x8dGlkZSUyMHBvb2x8ZW58MHwwfHx8MTc5NTY3NjMyNXwy",
    width: 4290,
    height: 2856,
    photographer: "Reuben",
    username: "mangowastaken",
    page: "green-and-brown-sea-anemones-in-a-tide-pool-4uu9DCL6vTY",
    alt: "Green and brown sea anemones packed together on the rock of a tide pool.",
  }),
  wadiRum: photo({
    id: "Ug7aq-cS-JY",
    file: "photo-1662747975359-9c40ddd55551",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8M3x8bWlsa3klMjB3YXklMjBkZXNlcnR8ZW58MHwwfHx8MTc5NTY3NjMyM3wy",
    width: 6720,
    height: 4480,
    photographer: "Dylan Shaw",
    username: "dylanshaw",
    page: "a-night-sky-with-stars-and-a-mountain-range-Ug7aq-cS-JY",
    alt: "The Milky Way rising over the dark sandstone hills of the Wadi Rum desert.",
  }),
  butte: photo({
    id: "poED7Zsm5n4",
    file: "photo-1620029288530-4ff6a684e33d",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8Mnx8bWlsa3klMjB3YXklMjBkZXNlcnR8ZW58MHwwfHx8MTc5NTY3NjMyM3wy",
    width: 5616,
    height: 3744,
    photographer: "Sean Jahansooz",
    username: "sean_ca",
    page: "brown-rocky-mountain-under-starry-night-poED7Zsm5n4",
    alt: "A sandstone butte in the desert under a sky full of stars.",
  }),
  mossRiver: photo({
    id: "f9qtLeroLNQ",
    file: "photo-1451903978882-b165bd94e45d",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8Nnx8aWNlbGFuZCUyMHZvbGNhbmljJTIwbGFuZHNjYXBlfGVufDB8MHx8fDE3OTU2NzYzMjd8Mg",
    width: 4752,
    height: 3168,
    photographer: "Roma R",
    username: "n3moy",
    page: "photo-of-river-and-green-grass-covered-moutain-f9qtLeroLNQ",
    alt: "A river cutting through moss-covered volcanic hills in Iceland.",
  }),
  vla: photo({
    id: "FGvx38Jx4z4",
    file: "photo-1702485665912-0c79685081e1",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8Mnx8cmFkaW8lMjB0ZWxlc2NvcGUlMjBhcnJheXxlbnwwfDB8fHwxNzk1Njc2MzIxfDI",
    width: 2667,
    height: 2000,
    photographer: "Raychel Sanner",
    username: "raychelsnr",
    page: "a-very-large-satellite-dish-sitting-on-top-of-a-train-track-FGvx38Jx4z4",
    alt: "An antenna of the Very Large Array on its rail track in New Mexico, with more dishes in the distance.",
  }),
  dome: photo({
    id: "hjFxqfQyuxo",
    file: "photo-1727034394040-0377258a5791",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8MXx8b2JzZXJ2YXRvcnklMjBkb21lJTIwbmlnaHQlMjBza3l8ZW58MHwwfHx8MTc5NTY3NjM1MXwy",
    width: 4000,
    height: 3000,
    photographer: "Ahmed Atef",
    username: "ahmedatef19",
    page: "a-large-dome-with-a-star-filled-sky-in-the-background-hjFxqfQyuxo",
    alt: "An observatory dome under a star-filled night sky.",
  }),
  hotSpring: photo({
    id: "wIFI9f6eISs",
    file: "photo-1782735421936-dcff4d992674",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8M3x8Z2VvdGhlcm1hbCUyMGhvdCUyMHNwcmluZyUyMGFlcmlhbHxlbnwwfDB8fHwxNzk1Njc2MzUzfDI",
    width: 6654,
    height: 4500,
    photographer: "Bo Zhang",
    username: "bozh_ntu",
    page: "aerial-view-of-a-winding-river-and-colorful-desert-landscape-wIFI9f6eISs",
    alt: "A mineral spring seen from above, its orange deposits fanning out beside a winding green river.",
  }),
  dishSilhouette: photo({
    id: "QZKrCqDzCC0",
    file: "photo-1743412059152-d577187040c1",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8NHx8cmFkaW8lMjB0ZWxlc2NvcGUlMjBhcnJheXxlbnwwfDB8fHwxNzk1Njc2MzIxfDI",
    width: 4204,
    height: 2365,
    photographer: "Svetogor Maliugin",
    username: "svetogor",
    page: "a-radio-telescope-silhouetted-against-the-sky-QZKrCqDzCC0",
    alt: "A radio telescope in silhouette on a dark ridge against a pale sky.",
  }),
  fountainPen: photo({
    id: "xG8IQMqMITM",
    file: "photo-1471107340929-a87cd0f5b5f3",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8MXx8bm90ZWJvb2slMjBmb3VudGFpbiUyMHBlbiUyMGRlc2t8ZW58MHwwfHx8MTc5NTY3NjM1M3wy",
    width: 4592,
    height: 3448,
    photographer: "Aaron Burden",
    username: "aaronburden",
    page: "fountain-pen-on-spiral-book-xG8IQMqMITM",
    alt: "A fountain pen resting on a blank ruled notebook on a wooden desk.",
  }),
  oldBlackboard: photo({
    id: "5mZ_M06Fc9g",
    file: "photo-1453733190371-0a9bedd82893",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8M3x8Y2hhbGtib2FyZCUyMGVxdWF0aW9uc3xlbnwwfDB8fHwxNzk1Njc2MzIyfDI",
    width: 3264,
    height: 2448,
    photographer: "Roman Mager",
    username: "roman_lazygeek",
    page: "written-equations-on-brown-wooden-board-5mZ_M06Fc9g",
    alt: "Formulas in chalk on a worn old blackboard.",
  }),
  joshuaTree: photo({
    id: "62OK9xwVA0c",
    file: "photo-1497294815431-9365093b7331",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8MXx8c3RhbmRpbmclMjBzdG9uZXMlMjBuaWdodCUyMHNreXxlbnwwfDB8fHwxNzk1Njc2MzUyfDI",
    width: 3600,
    height: 2400,
    photographer: "Pawel Nolbert",
    username: "hellocolor",
    page: "rock-mountain-during-starry-night-62OK9xwVA0c",
    alt: "Rounded boulders in silhouette at Joshua Tree, under a starry sky with a band of dusk colour.",
  }),
  lichen: photo({
    id: "QI42bMpNbTo",
    file: "photo-1785006488555-604addccce05",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8M3x8bGljaGVuJTIwb24lMjByb2NrfGVufDB8MHx8fDE3OTU2NzYzMjZ8Mg",
    width: 6048,
    height: 4032,
    photographer: "P Mantha",
    username: "pmantha",
    page: "rough-rock-surface-covered-with-vibrant-orange-and-grey-lichen-QI42bMpNbTo",
    alt: "Orange and grey lichen spreading across layered rock.",
  }),
  seaStars: photo({
    id: "skP-TKugyw8",
    file: "photo-1676918555984-52e9f736c493",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8MXx8dGlkZSUyMHBvb2x8ZW58MHwwfHx8MTc5NTY3NjMyNXwy",
    width: 6720,
    height: 4480,
    photographer: "Sunira Moses",
    username: "sunira",
    page: "a-group-of-sea-stars-sitting-on-top-of-a-rock-skP-TKugyw8",
    alt: "Sea stars and anemones clinging to a boulder at low tide.",
  }),
  cederberg: photo({
    id: "sgIfSl30YbE",
    file: "photo-1507754988072-8667848efc79",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8Mnx8c3RhbmRpbmclMjBzdG9uZXMlMjBuaWdodCUyMHNreXxlbnwwfDB8fHwxNzk1Njc2MzUyfDI",
    width: 6000,
    height: 4000,
    photographer: "Matthieu Joannon",
    username: "matt_j",
    page: "photography-of-stars-sgIfSl30YbE",
    alt: "A clear starry sky over a low rocky horizon in the Cederberg mountains.",
  }),
  starTree: photo({
    id: "yIi11AIBhXc",
    file: "photo-1641354113883-4a8304cb4608",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8MXx8bWlsa3klMjB3YXklMjBkZXNlcnR8ZW58MHwwfHx8MTc5NTY3NjMyM3wy",
    width: 6891,
    height: 3675,
    photographer: "Mark Nemenzo",
    username: "zensunni",
    page: "a-night-sky-with-stars-and-a-tree-in-the-foreground-yIi11AIBhXc",
    alt: "The Milky Way over desert scrub and a lone tree at night.",
  }),
  nightRidge: photo({
    id: "x00aHcPllOo",
    file: "photo-1567712631541-12e7def8aa20",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8Nnx8bWlsa3klMjB3YXklMjBkZXNlcnR8ZW58MHwwfHx8MTc5NTY3NjMyM3wy",
    width: 4320,
    height: 2700,
    photographer: "David Billings",
    username: "dav_billings",
    page: "mountain-photography-nighttime-x00aHcPllOo",
    alt: "A dense field of stars above the dark outline of a mountain ridge.",
  }),
  driftingJellyfish: photo({
    id: "tBnLsg_VDJw",
    file: "photo-1508138119323-5452bd81d53d",
    ixid: "M3wxMDE3MjIwfDB8MXxzZWFyY2h8NHx8ZGVlcCUyMHNlYSUyMGplbGx5ZmlzaHxlbnwwfDB8fHwxNzk1Njc2MzI0fDI",
    width: 5184,
    height: 3456,
    photographer: "Mathieu Turle",
    username: "nbmat",
    page: "jelly-fish-under-the-sea-tBnLsg_VDJw",
    alt: "A few small jellyfish drifting in deep blue water.",
  }),
} as const satisfies Record<string, ArticlePhoto>;

/**
 * Hand-picked photographs, matched by slug PREFIX (CMS slugs are long and
 * sometimes edited at the tail). First match wins, so keep longer prefixes
 * above shorter ones that share a start.
 */
export const ARTICLE_PHOTOS: readonly { prefix: string; photo: ArticlePhoto }[] = [
  // Life elsewhere: the least Earth-like animals we have.
  { prefix: "evolution-beyond-earth", photo: PHOTOS.jellyfish },
  // Seven sins: a severe, beautiful place that punishes carelessness.
  { prefix: "the-seven-deadly-sins-of-science-fiction-worldbuilding", photo: PHOTOS.blackSand },
  // The Drake equation, on the chalkboard the title names.
  { prefix: "the-most-important-question-you-can-write-on-a-chalkboard", photo: PHOTOS.chalkboard },
  // Exoplanet to epic: the nearest thing on Earth to another world.
  { prefix: "from-exoplanet-to-epic", photo: PHOTOS.badlands },
  // The cascade: biology shaped wholly by where it lives.
  { prefix: "the-cascade-framework", photo: PHOTOS.anemones },
  // The built-in fallback article (shown when the CMS is empty).
  { prefix: "drake-equation", photo: PHOTOS.vlaDawn },
];

/** Pools for articles with no hand-picked photo, by CMS category. */
export const CATEGORY_PHOTO_POOLS: Record<string, readonly ArticlePhoto[]> = {
  basics: [PHOTOS.wadiRum, PHOTOS.butte, PHOTOS.mossRiver],
  science: [PHOTOS.vla, PHOTOS.dome, PHOTOS.hotSpring, PHOTOS.dishSilhouette],
  craft: [PHOTOS.fountainPen, PHOTOS.oldBlackboard, PHOTOS.joshuaTree],
  "case-studies": [PHOTOS.lichen, PHOTOS.seaStars, PHOTOS.cederberg],
};

/** Used when the category is missing or new. */
export const DEFAULT_PHOTO_POOL: readonly ArticlePhoto[] = [
  PHOTOS.starTree,
  PHOTOS.nightRidge,
  PHOTOS.driftingJellyfish,
];

/** Every photograph in use, for the credits test and for audits. */
export const ALL_ARTICLE_PHOTOS: readonly ArticlePhoto[] = Object.values(PHOTOS);

/** FNV-1a, 32-bit: the same stable hash the generated covers are seeded with. */
function hashSlug(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The photograph for an article. Deterministic: a hand-picked photo if the
 * slug matches a prefix, otherwise one from the category pool seeded by slug.
 */
export function photoForArticle(slug: string, category?: string): ArticlePhoto {
  const picked = ARTICLE_PHOTOS.find((row) => slug.startsWith(row.prefix));
  if (picked) return picked.photo;
  const pool = (category && CATEGORY_PHOTO_POOLS[category]) || DEFAULT_PHOTO_POOL;
  return pool[hashSlug(slug) % pool.length];
}

export interface PhotoSize {
  /** Rendered width in CSS pixels (before device pixel ratio). */
  w: number;
  /** Rendered height; with it the image is cropped to exactly w x h. */
  h?: number;
  /** JPEG/WebP quality, 1 to 100. */
  q?: number;
}

/** A sized hotlink: the base URL plus Unsplash's imgix parameters. */
export function photoSrc(p: ArticlePhoto, { w, h, q = 70 }: PhotoSize): string {
  const size = h ? `&w=${w}&h=${h}` : `&w=${w}`;
  return `${p.url}${size}&q=${q}&auto=format&fit=crop&crop=entropy`;
}

/** `srcset` for a fixed aspect ratio (height / width) at several widths. */
export function photoSrcSet(p: ArticlePhoto, widths: readonly number[], ratio: number, q?: number): string {
  return widths
    .map((w) => `${photoSrc(p, { w, h: Math.round(w * ratio), q })} ${w}w`)
    .join(", ");
}

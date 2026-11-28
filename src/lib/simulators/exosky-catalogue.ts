// ---------------------------------------------------------------------------
// exosky-catalogue, ExoSky's real star catalogue (1.9, N3 / E4 / E5).
//
// HYG database v4.1 (David Nash, astronexus; CC BY-SA 4.0,
// https://github.com/astronexus/HYG-Database). public/tools/exosky/hyg-v41.bin
// is a compact derived subset built by scripts/exosky/build-hyg-catalogue.py:
// every star naked-eye from Earth (V <= 6.5) plus every star within 100 pc of
// the Sun, about 30,000 stars, each with a stable id.
//
// Ids are the only truth (Constitution). A star is "HIP 32349" when Hipparcos
// numbered it, otherwise "HYG <n>". Constellations store these ids, never
// names or positions, so a constellation drawn from Tau Ceti e still points at
// the same stars when the catalogue is corrected.
//
// Pure parse + one cached fetch. No React.
// ---------------------------------------------------------------------------

export interface CatalogueStar {
  /** Index in the catalogue (brightest-from-Earth first). */
  i: number;
  /** "HIP 32349" or "HYG 118"; stable across sessions. */
  id: string;
  /** Heliocentric J2000 equatorial position, parsecs. */
  x: number;
  y: number;
  z: number;
  /** Distance from the Sun, parsecs. */
  dist: number;
  /** Absolute V magnitude. */
  absMag: number;
  /** B-V colour index (0.65, solar, when the catalogue has none). */
  bv: number;
  /** Proper name ("Sirius"), when it has one. */
  name: string | null;
  /** Bayer / Flamsteed designation with constellation ("9Alp CMa"), when bright. */
  bf: string | null;
}

export const CATALOGUE_URL = "/tools/exosky/hyg-v41.bin";
export const CATALOGUE_CREDIT =
  "Star catalogue: HYG database v4.1, David Nash (astronexus), CC BY-SA 4.0. Subset: naked-eye from Earth plus all stars within 100 pc.";

const MAGIC = "SFHYG41";
const HIP_FLAG = 0x80000000;

export function catalogueIdOf(raw: number): string {
  // >>> 0 keeps the flag bit unsigned.
  const u = raw >>> 0;
  return u & HIP_FLAG ? `HYG ${(u & 0x7fffffff) >>> 0}` : `HIP ${u}`;
}

/** A readable designation: "9Alp CMa" -> "α CMa", "61 Cyg" stays. */
export function prettyDesignation(bf: string | null): string | null {
  if (!bf) return null;
  const GREEK: Record<string, string> = {
    Alp: "α", Bet: "β", Gam: "γ", Del: "δ", Eps: "ε", Zet: "ζ", Eta: "η", The: "θ",
    Iot: "ι", Kap: "κ", Lam: "λ", Mu: "μ", Nu: "ν", Xi: "ξ", Omi: "ο", Pi: "π",
    Rho: "ρ", Sig: "σ", Tau: "τ", Ups: "υ", Phi: "φ", Chi: "χ", Psi: "ψ", Ome: "ω",
  };
  const m = /^(\d*)([A-Z][a-z]{1,2})?(\d*)\s*([A-Z][A-Za-z]{2})$/.exec(bf.trim());
  if (!m) return bf.trim();
  const [, flam, greek, sup, con] = m;
  if (greek && GREEK[greek]) return `${GREEK[greek]}${sup ? sup : ""} ${con}`;
  if (flam) return `${flam} ${con}`;
  return bf.trim();
}

/** Display name for a star: proper name, else designation, else id. */
export function starLabel(s: Pick<CatalogueStar, "name" | "bf" | "id">): string {
  return s.name ?? prettyDesignation(s.bf) ?? s.id;
}

/** Parse the binary. Throws on a malformed file rather than drawing garbage. */
export function parseCatalogue(buf: ArrayBuffer): CatalogueStar[] {
  const view = new DataView(buf);
  let magic = "";
  for (let k = 0; k < 7; k++) magic += String.fromCharCode(view.getUint8(k));
  if (magic !== MAGIC) throw new Error("STAR CATALOGUE UNREADABLE.");
  const n = view.getUint32(8, true);
  const jsonLen = view.getUint32(12, true);
  const expected = 16 + 16 * n + jsonLen;
  if (buf.byteLength < expected) throw new Error("STAR CATALOGUE TRUNCATED.");

  let off = 16;
  const xs = new Float32Array(buf, off, n); off += 4 * n;
  const ys = new Float32Array(buf, off, n); off += 4 * n;
  const zs = new Float32Array(buf, off, n); off += 4 * n;
  const mags = new Int16Array(buf, off, n); off += 2 * n;
  const bvs = new Int16Array(buf, off, n); off += 2 * n;
  const ids = new Uint32Array(buf, off, n); off += 4 * n;
  const jsonBytes = new Uint8Array(buf, off, jsonLen);
  const names = (JSON.parse(new TextDecoder().decode(jsonBytes)) as { names: Record<string, [string, string]> }).names;

  const out: CatalogueStar[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i], z = zs[i];
    const nm = names[String(i)];
    out[i] = {
      i,
      id: catalogueIdOf(ids[i]),
      x, y, z,
      dist: Math.hypot(x, y, z),
      absMag: mags[i] / 100,
      bv: bvs[i] === 32767 ? 0.65 : bvs[i] / 1000,
      name: nm && nm[0] ? nm[0] : null,
      bf: nm && nm[1] ? nm[1] : null,
    };
  }
  return out;
}

let cache: Promise<CatalogueStar[]> | null = null;

/** Fetch once per session. A failed fetch is not cached, so a retry can work. */
export function loadCatalogue(fetcher: typeof fetch = fetch): Promise<CatalogueStar[]> {
  if (!cache) {
    cache = fetcher(CATALOGUE_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`STAR CATALOGUE UNAVAILABLE (${r.status}).`);
        return r.arrayBuffer();
      })
      .then(parseCatalogue)
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

/** Index by id, for constellations and search. */
export function indexById(stars: readonly CatalogueStar[]): Map<string, CatalogueStar> {
  const m = new Map<string, CatalogueStar>();
  for (const s of stars) m.set(s.id, s);
  return m;
}

/** Case-insensitive search over names, designations and ids. Brightest first. */
export function searchCatalogue(stars: readonly CatalogueStar[], query: string, limit = 8): CatalogueStar[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: CatalogueStar[] = [];
  for (const s of stars) {
    const hay = [s.name, prettyDesignation(s.bf), s.bf, s.id].filter(Boolean).join(" ").toLowerCase();
    if (hay.includes(q)) {
      out.push(s);
      if (out.length >= limit) break;
    }
  }
  return out;
}

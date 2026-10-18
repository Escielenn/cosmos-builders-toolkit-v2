// ---------------------------------------------------------------------------
// sources, one read interface over everything a writer can hand the import:
// loose files, a picked directory (webkitdirectory), or a .zip.
//
// Paths use "/" and are relative to what was picked. Hidden files, macOS
// resource forks (__MACOSX/, ._x) and .DS_Store never appear.
// ---------------------------------------------------------------------------

export interface FileSource {
  paths: string[];
  readText(path: string): Promise<string | null>;
  readBinary(path: string): Promise<ArrayBuffer | null>;
}

export function isJunkPath(path: string): boolean {
  return path.split("/").some((seg) => seg === "__MACOSX" || seg === ".DS_Store" || seg.startsWith("._") || (seg.startsWith(".") && seg.length > 1));
}

/** Files from an <input type="file">, keyed by their relative path when picked as a directory. */
export function sourceFromFiles(files: File[]): FileSource {
  const map = new Map<string, File>();
  for (const f of files) {
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    const path = rel.replace(/\\/g, "/");
    if (!isJunkPath(path)) map.set(path, f);
  }
  return {
    paths: Array.from(map.keys()),
    readText: async (p) => (map.has(p) ? await map.get(p)!.text() : null),
    readBinary: async (p) => (map.has(p) ? await map.get(p)!.arrayBuffer() : null),
  };
}

/** A .zip's contents. jszip loads only when a zip is actually opened. */
export async function sourceFromZip(data: ArrayBuffer | Uint8Array): Promise<FileSource> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(data);
  const entries = new Map<string, import("jszip").JSZipObject>();
  zip.forEach((path, entry) => {
    if (!entry.dir && !isJunkPath(path)) entries.set(path.replace(/\\/g, "/"), entry);
  });
  return {
    paths: Array.from(entries.keys()),
    readText: async (p) => (entries.has(p) ? await entries.get(p)!.async("string") : null),
    readBinary: async (p) => (entries.has(p) ? await entries.get(p)!.async("arraybuffer") : null),
  };
}

/** The project file of a Scrivener bundle, if the source holds one. */
export function findScrivx(source: FileSource): string | null {
  const hits = source.paths.filter((p) => /\.scrivx$/i.test(p) && !/\/Files\//i.test(p));
  if (!hits.length) return null;
  return hits.sort((a, b) => a.split("/").length - b.split("/").length || a.length - b.length)[0];
}

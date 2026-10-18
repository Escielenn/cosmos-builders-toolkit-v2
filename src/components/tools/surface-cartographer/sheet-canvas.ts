// ---------------------------------------------------------------------------
// Browser helpers: images and canvases for the Surface Cartographer.
//
// The globe always samples an EQUIRECTANGULAR texture, because that is what
// a sphere's UVs are. A Mercator sheet is reprojected here, row by row, on a
// 2D canvas — one drawImage per output row, so even a 4k sheet converts in a
// few milliseconds and no WebGL is involved. The latitude each row needs is
// computed by the same pure functions the flat map uses (geo.ts), so the two
// views cannot disagree about where a place is.
// ---------------------------------------------------------------------------

import type { MapProjection } from "@/lib/atlas/placement";
import { latLonToSheet } from "@/lib/surface-cartographer/geo";
import {
  buildSurfaceModel,
  renderBaseMap,
  type BaseMapParams,
  type SurfaceModel,
} from "@/lib/surface-cartographer/basemap";

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // The sheet becomes a WebGL texture; a tainted canvas cannot.
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("SHEET COULD NOT BE LOADED."));
    img.src = url;
  });
}

/** Read an image file's pixel size without uploading it. */
export function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("IMAGE COULD NOT BE READ."));
    };
    img.src = url;
  });
}

/** The globe's texture width. Height is half. Capped by GPU sanity, not taste. */
const GLOBE_WIDTH = 2048;

export function toEquirectCanvas(img: HTMLImageElement, projection: MapProjection): HTMLCanvasElement {
  const w = Math.min(GLOBE_WIDTH, Math.max(256, img.naturalWidth));
  const h = Math.round(w / 2);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  if (projection === "equirectangular") {
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }

  const aspect = img.naturalWidth / img.naturalHeight;
  const srcH = img.naturalHeight;
  for (let row = 0; row < h; row++) {
    const lat = 90 - ((row + 0.5) / h) * 180;
    const y = latLonToSheet({ lat, lon: 0 }, "mercator", aspect).y;
    if (y < 0 || y > 1) continue; // beyond the sheet: left clear, drawn as a cap
    const sy = Math.min(srcH - 1, Math.max(0, Math.floor(y * srcH)));
    ctx.drawImage(img, 0, sy, img.naturalWidth, 1, 0, row, w, 1);
  }
  return canvas;
}

export const BASEMAP_WIDTH = 1024;
export const BASEMAP_HEIGHT = 512;

export interface GeneratedMap {
  model: SurfaceModel;
  canvas: HTMLCanvasElement;
}

/** Paint the generated surface onto a fresh 2:1 canvas. */
export function paintBaseMap(params: BaseMapParams): GeneratedMap {
  const model = buildSurfaceModel(params);
  const canvas = document.createElement("canvas");
  canvas.width = BASEMAP_WIDTH;
  canvas.height = BASEMAP_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const pixels = renderBaseMap(model, BASEMAP_WIDTH, BASEMAP_HEIGHT);
    ctx.putImageData(new ImageData(pixels, BASEMAP_WIDTH, BASEMAP_HEIGHT), 0, 0);
  }
  return { model, canvas };
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("MAP COULD NOT BE ENCODED."))), "image/png");
  });
}

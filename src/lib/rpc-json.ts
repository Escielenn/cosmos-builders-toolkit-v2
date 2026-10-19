/**
 * Narrowing helpers for Supabase RPCs that return `json` / `jsonb`.
 *
 * The generated types give those RPCs a `Json` return, which the caller
 * knows the shape of but the compiler does not. These helpers check the
 * outer shape at runtime (object vs array) and only then assert the
 * caller's row type. They do not validate individual fields.
 */
import type { Json } from "@/integrations/supabase/types";

export class RpcShapeError extends Error {
  constructor(expected: "object" | "array") {
    super(`UNEXPECTED RESPONSE. EXPECTED ${expected.toUpperCase()}.`);
    this.name = "RpcShapeError";
  }
}

/** Plain JSON object (not null, not an array). */
export function isJsonObject(value: unknown): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** An RPC that returns a single JSON object. Throws on any other shape. */
export function rpcObject<T extends object>(data: Json | null | undefined): T {
  if (!isJsonObject(data)) throw new RpcShapeError("object");
  return data as unknown as T;
}

/** An RPC that returns a JSON array. `null` reads as empty; other shapes throw. */
export function rpcArray<T>(data: Json | null | undefined): T[] {
  if (data === null || data === undefined) return [];
  if (!Array.isArray(data)) throw new RpcShapeError("array");
  return data as unknown as T[];
}

/**
 * Convert a plain value to `Json` for a json/jsonb column write.
 *
 * supabase-js sends the body through JSON.stringify, so a JSON round trip
 * yields exactly the bytes the server would have received anyway (undefined
 * fields dropped, Dates as ISO strings). It turns "I promise this is JSON"
 * into something the compiler can check, without a cast.
 */
export function toJson(value: unknown): Json {
  if (value === undefined) return null;
  const text = JSON.stringify(value);
  return text === undefined ? null : (JSON.parse(text) as Json);
}

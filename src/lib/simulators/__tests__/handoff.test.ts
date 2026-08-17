import { describe, it, expect } from "vitest";
import {
  encodeHandoff,
  decodeHandoff,
  solarisPlanetTypeLabel,
  describeHandoffPlanet,
  type HandoffPayload,
} from "@/lib/simulators/handoff";

describe("encodeHandoff / decodeHandoff", () => {
  const payload: HandoffPayload = {
    from: "solaris",
    starType: "orange",
    starMassLum: 0.42,
    planetAU: 1.3,
    planetName: "Ashgrave-III",
    planetType: "terrestrial",
  };

  it("round-trips a payload through a URL query string", () => {
    const encoded = encodeHandoff(payload);
    const params = new URLSearchParams(`handoff=${encoded}`);
    expect(decodeHandoff(params)).toEqual(payload);
  });

  it("returns null for a missing handoff param", () => {
    expect(decodeHandoff(new URLSearchParams())).toBeNull();
  });

  it("returns null rather than throwing on a corrupted value", () => {
    expect(decodeHandoff(new URLSearchParams("handoff=not-valid-base64!!"))).toBeNull();
  });

  it("rejects a payload whose starType is not one of Solaris's five", () => {
    // encodeHandoff itself is typed to prevent this at compile time; this test
    // guards the runtime decode path against a hand-crafted or future-version
    // URL. Bypass the type system deliberately to build a well-formed
    // base64/JSON blob whose starType is invalid, so the assertion actually
    // exercises isSolarisStarType rather than the "corrupted base64" path
    // the test above already covers.
    const badPayload = { ...payload, starType: "purple" } as unknown as HandoffPayload;
    const encoded = encodeHandoff(badPayload);
    const params = new URLSearchParams(`handoff=${encoded}`);
    expect(decodeHandoff(params)).toBeNull();
  });

  it("produces URL-safe output and round-trips through an actual URL with a non-ASCII planet name", () => {
    // Solaris planet names are free-text and user-edited. Raw base64 (`+`,
    // `/`, `=`) is not safe to drop straight into a query string: a `+`
    // is read back as a space by URLSearchParams/application-x-www-form-
    // urlencoded parsing, corrupting the value before decodeHandoff even
    // sees it. An ASCII-only name can dodge this by luck (that's exactly
    // what let it slip through the first time); assert the URL-safety
    // property directly instead of hoping this particular string
    // reproduces it.
    const nonAsciiPayload: HandoffPayload = {
      ...payload,
      planetName: "Ashgräve-Ïarlünd",
    };
    const encoded = encodeHandoff(nonAsciiPayload);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);

    const url = new URL(`https://example.com/tools/exosky?handoff=${encoded}`);
    expect(decodeHandoff(url.searchParams)).toEqual(nonAsciiPayload);
  });
});

describe("solarisPlanetTypeLabel", () => {
  it("maps a compound raw typeKey to Solaris's real display name", () => {
    expect(solarisPlanetTypeLabel("gasgiant")).toBe("gas giant");
    expect(solarisPlanetTypeLabel("tidallocked")).toBe("tidal lock");
    expect(solarisPlanetTypeLabel("waterworld")).toBe("water world");
    expect(solarisPlanetTypeLabel("superearth")).toBe("super-earth");
  });

  it("falls back to the raw key for an unrecognised type", () => {
    expect(solarisPlanetTypeLabel("unknowntype")).toBe("unknowntype");
  });
});

describe("describeHandoffPlanet", () => {
  it("reads as a sentence for a compound typeKey, not a concatenated raw key", () => {
    const gasGiant: HandoffPayload = {
      from: "solaris",
      starType: "blue",
      starMassLum: 4.5,
      planetAU: 4.2,
      planetName: "Outer-IV",
      planetType: "gasgiant",
    };
    expect(describeHandoffPlanet(gasGiant)).toBe("gas giant planet, 4.20 AU from a blue star.");
  });

  it("uses 'an' before a vowel-leading star type", () => {
    const orangeStar: HandoffPayload = {
      from: "solaris",
      starType: "orange",
      starMassLum: 0.42,
      planetAU: 0.88,
      planetName: "PRIMARIS-II",
      planetType: "tidallocked",
    };
    expect(describeHandoffPlanet(orangeStar)).toBe("tidal lock planet, 0.88 AU from an orange star.");
  });
});

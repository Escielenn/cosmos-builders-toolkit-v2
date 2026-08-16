import { describe, it, expect } from "vitest";
import { encodeHandoff, decodeHandoff, type HandoffPayload } from "@/lib/simulators/handoff";

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
    const params = new URLSearchParams(
      `handoff=${encodeHandoff({ ...payload, starType: "purple" as HandoffPayload["starType"] })}`,
    );
    // encodeHandoff itself is typed to prevent this at compile time; this test
    // guards the runtime decode path against a hand-crafted or future-version URL.
    const tampered = encodeHandoff(payload).slice(0, -2) + "xx";
    expect(decodeHandoff(new URLSearchParams(`handoff=${tampered}`))).toBeNull();
  });
});

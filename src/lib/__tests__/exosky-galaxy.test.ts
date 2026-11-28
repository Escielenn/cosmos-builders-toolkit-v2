import { describe, it, expect } from "vitest";
import { nearestArm, nearestArmForObserver, armRadiusPc, REID_2019_ARMS } from "@/lib/simulators/exosky-galaxy";
import { R_SUN, raDecDistToXYZ } from "@/lib/simulators/astro";

describe("spiral arms (Reid et al. 2019)", () => {
  it("includes the Local (Orion) Arm, which 1.8's model lacked", () => {
    expect(REID_2019_ARMS.map((a) => a.name)).toContain("Local Arm");
  });
  it("puts the Local Arm's kink at 8.26 kpc (scaled to R_SUN)", () => {
    const local = REID_2019_ARMS.find((a) => a.name === "Local Arm")!;
    expect(armRadiusPc(local, local.betaKink)).toBeCloseTo(8260 * (R_SUN / 8150), 0);
  });
  it("names the Local Arm as the Sun's nearest, within half a kiloparsec", () => {
    const a = nearestArm(R_SUN, 0);
    expect(a.name).toBe("Local Arm");
    expect(a.distancePc).toBeLessThan(500);
  });
  it("tells Proxima the same (it is 1.3 pc away)", () => {
    expect(nearestArmForObserver(raDecDistToXYZ(217.4, -62.7, 1.3)).name).toBe("Local Arm");
  });
});

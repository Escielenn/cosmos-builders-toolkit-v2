// ═══════════════════════════════════════════════════════════════
// EXOSKY Milky Way Computation Worker
// StellarForge.tools
// Offloads heavy ray-marching integration to a background thread
// ═══════════════════════════════════════════════════════════════

const DISK_SCALE_H = 2600;
const DISK_SCALE_Z = 300;
const DUST_SCALE_Z = 120;
const ARM_WIDTH = 500;
const ARM_PITCH = 12 * Math.PI / 180;
const BULGE_RADIUS = 1200;
const L_STEPS = 360;
const B_STEPS = 180;
const RAY_STEPS = 40;
const RAY_MAX = 15000;
const REF_RADIUS = 4000;

const SPIRAL_ARMS = [
  { theta0: 0, boost: 1.0 },
  { theta0: Math.PI * 0.5, boost: 1.2 },
  { theta0: Math.PI, boost: 1.1 },
  { theta0: Math.PI * 1.5, boost: 0.8 },
];

function spiralArmAngle(R) {
  return Math.log(Math.max(R, 100) / REF_RADIUS) / Math.tan(ARM_PITCH);
}

function nearestArmDistance(R, theta) {
  let minDist = Infinity;
  for (const arm of SPIRAL_ARMS) {
    const armAngle = arm.theta0 + spiralArmAngle(R);
    let dTheta = theta - armAngle;
    dTheta = ((dTheta % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    const arcDist = Math.abs(dTheta) * R;
    const weighted = arcDist / arm.boost;
    if (weighted < minDist) minDist = weighted;
  }
  return minDist;
}

function galacticDensity(gcX, gcY, gcZ) {
  const R = Math.sqrt(gcX * gcX + gcY * gcY);
  const z = gcZ;
  let density = Math.exp(-R / DISK_SCALE_H) * Math.exp(-Math.abs(z) / DISK_SCALE_Z);
  const theta = Math.atan2(gcY, gcX);
  const armDist = nearestArmDistance(R, theta);
  const armFactor = 1.0 + 2.5 * Math.exp(-(armDist * armDist) / (ARM_WIDTH * ARM_WIDTH * 2));
  density *= armFactor;
  const bulgeR = Math.sqrt(R * R + z * z * 4);
  density += 3.0 * Math.exp(-(bulgeR * bulgeR) / (BULGE_RADIUS * BULGE_RADIUS));
  return density;
}

function dustExtinction(gcX, gcY, gcZ) {
  const R = Math.sqrt(gcX * gcX + gcY * gcY);
  const z = gcZ;
  return Math.exp(-R / (DISK_SCALE_H * 1.2)) * Math.exp(-Math.abs(z) / DUST_SCALE_Z) * 0.5;
}

function computeMilkyWayMap(obsGCx, obsGCy, obsGCz) {
  const map = new Float32Array(L_STEPS * B_STEPS);
  const dustMap = new Float32Array(L_STEPS * B_STEPS);

  for (let li = 0; li < L_STEPS; li++) {
    const l = (li / L_STEPS) * 2 * Math.PI;
    for (let bi = 0; bi < B_STEPS; bi++) {
      const b = ((bi / B_STEPS) - 0.5) * Math.PI;
      const cosB = Math.cos(b);
      const obsR = Math.sqrt(obsGCx * obsGCx + obsGCy * obsGCy);
      const obsTheta = Math.atan2(obsGCy, obsGCx);
      const dirTheta = obsTheta + Math.PI + l;
      const dx = cosB * Math.cos(dirTheta);
      const dy = cosB * Math.sin(dirTheta);
      const dz = Math.sin(b);

      let brightness = 0;
      let cumDust = 0;

      for (let s = 1; s <= RAY_STEPS; s++) {
        const t = (s / RAY_STEPS) * RAY_MAX;
        const px = obsGCx + dx * t;
        const py = obsGCy + dy * t;
        const pz = obsGCz + dz * t;
        const R = Math.sqrt(px * px + py * py);
        if (R > 20000 || Math.abs(pz) > 5000) continue;
        const d = galacticDensity(px, py, pz);
        const dust = dustExtinction(px, py, pz);
        cumDust += dust * (RAY_MAX / RAY_STEPS) * 0.0001;
        const attenuation = Math.exp(-cumDust);
        brightness += d * attenuation * (RAY_MAX / RAY_STEPS) * 0.00004;
      }

      map[li * B_STEPS + bi] = Math.min(brightness, 1.0);
      dustMap[li * B_STEPS + bi] = Math.min(cumDust, 1.0);
    }
  }
  return { brightness: map, dust: dustMap };
}

self.onmessage = function (e) {
  const { obsGCx, obsGCy, obsGCz } = e.data;
  const result = computeMilkyWayMap(obsGCx, obsGCy, obsGCz);
  self.postMessage(
    { brightness: result.brightness, dust: result.dust },
    [result.brightness.buffer, result.dust.buffer]
  );
};
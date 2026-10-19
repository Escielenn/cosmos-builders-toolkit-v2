import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// EXOSKY v2 — Alien Night Sky Simulator with Milky Way
// StellarForge.tools · © 2025–2026 Jason D. Batt, Ph.D.
// ═══════════════════════════════════════════════════════════════

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ── GALACTIC CONSTANTS ────────────────────────────────────────
const R_SUN = 8200;        // Sun's distance from galactic center (pc)
const Z_SUN = 25;          // Sun's height above galactic plane (pc)
const DISK_SCALE_H = 2600; // Radial scale length (pc)
const DISK_SCALE_Z = 300;  // Vertical scale height - thin disk (pc)
const DUST_SCALE_Z = 120;  // Dust lane scale height (pc)
const ARM_WIDTH = 500;     // Spiral arm Gaussian width (pc)
const ARM_PITCH = 12 * DEG;// Spiral arm pitch angle
const BULGE_RADIUS = 1200; // Galactic bulge effective radius (pc)

// ── EQUATORIAL → GALACTIC ROTATION MATRIX ─────────────────────
// IAU 1958 system: NGP at (192.859°, 27.128°), l_NCP = 122.932°
const R_EQ_TO_GAL = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [ 0.4941094279, -0.4448296300,  0.7469822445],
  [-0.8676661490, -0.1980763734,  0.4559837762]
];

function eqToGal(x, y, z) {
  return [
    R_EQ_TO_GAL[0][0]*x + R_EQ_TO_GAL[0][1]*y + R_EQ_TO_GAL[0][2]*z,
    R_EQ_TO_GAL[1][0]*x + R_EQ_TO_GAL[1][1]*y + R_EQ_TO_GAL[1][2]*z,
    R_EQ_TO_GAL[2][0]*x + R_EQ_TO_GAL[2][1]*y + R_EQ_TO_GAL[2][2]*z,
  ];
}

// Transpose for inverse
function galToEq(gx, gy, gz) {
  return [
    R_EQ_TO_GAL[0][0]*gx + R_EQ_TO_GAL[1][0]*gy + R_EQ_TO_GAL[2][0]*gz,
    R_EQ_TO_GAL[0][1]*gx + R_EQ_TO_GAL[1][1]*gy + R_EQ_TO_GAL[2][1]*gz,
    R_EQ_TO_GAL[0][2]*gx + R_EQ_TO_GAL[1][2]*gy + R_EQ_TO_GAL[2][2]*gz,
  ];
}

// ── COORDINATE CONVERSIONS ────────────────────────────────────
function raDecDistToXYZ(ra, dec, dist) {
  const r = dist;
  const cd = Math.cos(dec * DEG);
  return [r * cd * Math.cos(ra * DEG), r * cd * Math.sin(ra * DEG), r * Math.sin(dec * DEG)];
}

function xyzToRaDec(x, y, z) {
  const dist = Math.sqrt(x*x + y*y + z*z);
  if (dist < 1e-12) return { ra: 0, dec: 0, dist: 0 };
  const dec = Math.asin(Math.max(-1, Math.min(1, z / dist))) * RAD;
  let ra = Math.atan2(y, x) * RAD;
  if (ra < 0) ra += 360;
  return { ra, dec, dist };
}

function eqXYZtoGalactocentric(eqX, eqY, eqZ) {
  // Convert equatorial heliocentric XYZ to galactocentric
  const [gx, gy, gz] = eqToGal(eqX, eqY, eqZ);
  // In Sun-centered galactic: gx toward GC, gy toward l=90°, gz toward NGP
  // Galactocentric: Sun is at (R_SUN, 0, Z_SUN) from center
  // Direction toward GC is +gx from Sun, so GC is at (R_SUN, 0, -Z_SUN) from Sun in galactic frame
  // Thus galactocentric position = (R_SUN - gx, -gy, Z_SUN + gz)
  // Wait: l=0 is toward GC, so +gx points toward GC from Sun
  // In GC-centric frame with x toward Sun: x_GC = R_SUN - gx, but we want
  // a frame centered on GC. Let's use: GC x-axis through Sun, y perpendicular in plane
  return [R_SUN - gx, -gy, Z_SUN + gz];
}

function apparentMag(absMag, distPc) {
  if (distPc <= 0.001) return -26.7;
  return absMag + 5 * Math.log10(distPc / 10);
}

function bvToRGB(bv) {
  let t, r, g, b;
  bv = Math.max(-0.4, Math.min(2.0, bv));
  if (bv < 0)      { t=(bv+.4)/.4;  r=.61+.39*t; g=.70+.30*t; b=1; }
  else if (bv<.4)   { t=bv/.4;       r=.83+.17*(1-t); g=.87+.13*(1-t); b=1; }
  else if (bv<.8)   { t=(bv-.4)/.4;  r=1; g=1-.2*t; b=1-.4*t; }
  else if (bv<1.2)  { t=(bv-.8)/.4;  r=1; g=.8-.15*t; b=.6-.25*t; }
  else              { t=Math.min(1,(bv-1.2)/.8); r=1; g=.65-.2*t; b=.35-.2*t; }
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

// ── EXPANDED STAR CATALOG ─────────────────────────────────────
// [name, RA(°), Dec(°), dist(pc), absMag, B-V]
// ~300 brightest stars from Hipparcos
const RAW_STARS = `Sirius,101.287,-16.716,2.64,-1.43,-0.01
Canopus,95.988,-52.696,95,-5.53,0.15
Arcturus,213.915,19.182,11.26,0.17,1.23
Vega,279.235,38.784,7.68,0.58,-0.01
Capella,79.172,45.998,13.12,-0.49,0.80
Rigel,78.634,-8.202,264,-6.98,-0.03
Procyon,114.827,5.225,3.51,2.68,0.42
Betelgeuse,88.793,7.407,197,-5.14,1.85
Achernar,24.429,-57.237,44.1,-2.77,-0.16
Hadar,210.956,-60.373,161,-5.42,-0.23
Altair,297.696,8.868,5.13,2.20,0.22
Acrux,186.650,-63.099,99,-4.19,-0.24
Aldebaran,68.980,16.509,20.43,-0.64,1.54
Spica,201.298,-11.161,77,-3.55,-0.24
Antares,247.352,-26.432,169,-5.28,1.83
Pollux,116.329,28.026,10.36,1.08,1.00
Fomalhaut,344.413,-29.622,7.70,1.72,0.09
Deneb,310.358,45.280,802,-8.38,0.09
Mimosa,191.930,-59.689,85,-3.92,-0.24
Regulus,152.093,11.967,23.76,-0.57,-0.11
Adhara,104.656,-28.972,132,-4.10,-0.21
Castor,113.650,31.888,15.80,0.59,0.03
Shaula,263.402,-37.104,216,-5.05,-0.22
Bellatrix,81.283,6.350,77,-2.78,-0.22
Elnath,81.573,28.608,40,-1.37,-0.13
Miaplacidus,138.300,-69.717,34,-0.99,0.07
Alnilam,84.053,-1.202,412,-6.38,-0.18
Alnitak,85.190,-1.943,225,-5.26,-0.21
Alnair,332.058,-46.961,31,-0.73,-0.07
Alioth,193.507,55.960,24.90,-0.22,0.02
Dubhe,165.932,61.751,37,-1.10,1.07
Mirfak,51.081,49.861,181,-4.17,0.48
Wezen,107.098,-26.393,490,-6.87,0.67
Sargas,264.330,-42.998,83,-2.75,0.40
Kaus Australis,276.043,-34.384,44,-1.44,-0.03
Avior,125.629,-59.509,187,-4.47,1.28
Alkaid,206.885,49.313,32,-0.60,-0.10
Menkalinan,89.882,44.948,25,-0.10,0.08
Atria,252.166,-69.028,121,-3.62,1.44
Alhena,99.428,16.399,32,-0.60,0.00
Peacock,306.412,-56.735,55,-1.81,-0.20
Mirzam,95.675,-17.956,153,-3.95,-0.24
Alphard,141.897,-8.659,54,-1.70,1.44
Polaris,37.954,89.264,133,-3.64,0.60
Hamal,31.793,23.462,20.20,0.48,1.15
Diphda,10.897,-17.987,29,-0.30,1.02
Nunki,283.816,-26.297,69,-2.14,-0.13
Menkent,211.671,-36.370,18,1.06,1.01
Alpheratz,2.097,29.091,29.70,-0.30,-0.04
Mirach,17.433,35.621,60,-1.86,1.58
Saiph,86.939,-9.670,198,-4.65,-0.18
Kochab,222.676,74.156,38,-0.87,1.47
Rasalhague,263.734,12.560,14.70,1.30,0.15
Algol,47.042,40.956,28.50,0.18,-0.05
Almach,30.975,42.330,109,-3.08,1.37
Denebola,177.265,14.572,11,1.93,0.09
Tiaki,340.667,-46.885,57,-1.52,1.56
Naos,120.896,-40.003,334,-5.95,-0.27
Aspidiske,139.273,-59.275,210,-4.42,0.18
Suhail,136.999,-43.433,175,-3.99,1.66
Alphecca,233.672,26.715,22.90,0.42,0.03
Mintaka,83.002,-0.299,281,-5.25,-0.21
Sadr,305.557,40.257,560,-6.12,0.67
Schedar,10.127,56.537,70,-1.99,1.17
Eltanin,269.152,51.489,46,-1.04,1.52
Dschubba,240.083,-22.622,136,-3.16,-0.12
Larawag,252.968,-34.293,19.50,0.78,1.44
Merak,165.460,56.383,24.40,0.41,0.03
Ankaa,6.571,-42.306,23.40,0.52,1.09
Girtab,264.330,-37.296,84,-3.46,-0.22
Enif,326.047,9.875,211,-4.19,1.52
Phecda,178.458,53.695,25.60,0.36,0.04
Scheat,345.944,28.083,60,-1.49,1.67
Algenib,3.309,15.184,109,-2.81,-0.11
Markab,346.190,15.205,42,-0.67,-0.04
Menkar,45.570,4.090,67,-1.61,1.64
Zosma,168.527,20.524,17.70,1.32,0.13
Arneb,83.183,-17.822,620,-5.40,0.21
Gienah,183.952,-17.542,56,-1.82,0.59
Ascella,285.653,-29.880,27.10,0.42,0.05
Zubeneschamali,229.252,-9.383,56,-1.16,-0.07
Unukalhai,236.067,6.426,22.70,0.87,1.17
Sheratan,28.660,20.808,18,1.55,0.13
Phact,84.912,-34.074,81,-1.93,-0.12
Ruchbah,18.615,60.235,30.50,0.25,0.13
Thuban,211.097,64.376,92,-1.20,0.00
Mizar,200.981,54.925,23.90,0.33,0.02
Alcor,201.306,54.988,24.80,0.40,0.16
Sabik,257.595,-15.725,27,0.37,0.15
Wazn,87.740,-35.768,27,0.70,0.50
Alderamin,319.645,62.586,15,1.58,0.22
Rasalgethi,258.662,14.390,110,-2.30,1.44
Kraz,188.597,-23.397,42,-0.61,0.89
Alkes,164.944,-18.299,53,-1.28,1.13
Acamar,44.565,-40.305,49,-1.46,0.04
Aludra,111.024,-29.303,620,-7.51,-0.18
Sceptrum,63.500,-7.653,117,-2.53,1.44
Cursa,76.963,-5.087,27,0.80,0.18
Furud,95.078,-30.063,102,-3.02,-0.18
Tureis,121.886,-24.304,56,-0.75,0.18
Muscida,127.566,60.718,56,-0.41,0.98
Megrez,183.857,57.033,25,1.39,0.08
Alula Australis,169.545,31.529,15,2.48,0.60
Zaniah,184.977,-0.666,22,1.89,0.18
Syrma,214.004,-5.998,21,2.47,0.60
Heze,206.885,-10.744,22,1.83,0.11
Acrab,241.359,-19.806,162,-3.50,-0.07
Dschubba,240.083,-22.622,136,-3.16,-0.12
Lesath,264.590,-37.296,176,-3.70,-0.22
Gacrux,187.791,-57.113,27,0.56,1.60
Azmidi,120.895,-24.304,56,-0.45,0.10
Naos,120.896,-40.003,334,-5.95,-0.27
Alsephina,131.176,-54.709,24,0.78,-0.04
Regor,122.383,-47.337,258,-5.31,-0.26
Suhail,136.999,-43.433,175,-3.99,1.66
Markeb,137.743,-55.011,165,-3.74,-0.21
Tseen Ke,260.502,-25.002,135,-2.61,0.14
Yed Prior,243.586,-3.694,52,-0.86,1.17
Yed Posterior,244.580,-4.693,32,0.55,1.04
Cebalrai,265.868,4.567,25,0.76,1.04
Graffias,241.098,-19.460,161,-3.50,-0.07
Wei,264.329,-34.293,19.50,0.78,1.44
Rastaban,262.608,52.301,111,-2.43,0.92
Etamin,269.152,51.489,46,-1.04,1.52
Nodus,242.520,72.148,28,0.63,0.44
Sol,0,0,0.0000048,4.83,0.65
Tau Ceti,26.017,-15.937,3.65,5.69,0.73
Epsilon Eridani,53.233,-9.458,3.22,6.19,0.88
Barnard's Star,269.452,4.694,1.83,13.22,1.74
61 Cygni A,316.733,38.750,3.50,7.49,1.17
Lalande 21185,165.834,35.970,2.55,10.44,1.51
Groombridge 34,1.099,44.024,3.58,10.33,1.57
Lacaille 9352,346.467,-35.854,3.29,9.75,1.50
Ross 154,282.457,-23.836,2.97,13.07,1.76
Ross 248,355.478,44.166,3.16,14.79,1.92
EZ Aquarii,339.382,-15.276,3.45,14.06,2.05
Luyten's Star,109.998,5.228,3.72,11.97,1.59
Kapteyn's Star,77.898,-44.960,3.91,10.87,1.57
Wolf 359,164.120,7.015,2.39,16.65,2.01
UV Ceti,24.761,-17.950,2.68,15.40,1.87
Teegarden's Star,43.254,16.878,3.83,17.22,2.30`.split("\n").map(line => {
  const [name, ...nums] = line.split(",");
  const [ra, dec, dist, absMag, bv] = nums.map(Number);
  return { name: name.trim(), ra, dec, dist: Math.max(dist, 0.001), absMag, bv, isCatalog: true };
});

// Additional bright stars to fill out the sky
const EXTRA_STARS = `Mira,34.836,-2.978,92,-0.5,1.53
Rasalhague,263.734,12.560,14.7,1.30,0.15
Tejat,95.740,22.514,71,-1.39,1.64
Propus,93.719,22.507,109,-1.84,1.39
Wasat,110.031,21.982,18,2.22,0.36
Mebsuta,100.983,25.131,275,-4.15,0.48
Tarazed,296.565,10.614,141,-2.72,1.52
Alshain,298.828,6.407,13.4,2.44,0.48
Rukbat,290.418,-40.616,52,-0.22,0.05
Dabih,305.253,-14.781,103,-2.04,0.47
Nashira,325.023,-16.662,42,-0.44,0.08
Sadalsuud,322.890,-5.571,195,-3.34,0.83
Sadalmelik,331.446,-0.320,240,-3.88,0.83
Ancha,335.414,-7.783,58,-0.62,0.92
Baten Kaitos,27.865,-10.335,80,-1.59,1.03
Acamar,44.565,-40.305,49,-1.46,0.04
Zaurak,59.507,-13.509,62,-0.84,1.06
Ain,67.154,19.180,46,-0.10,0.98
Tianguan,84.411,21.143,136,-1.32,0.01
Nihal,82.061,-20.759,49,-0.63,0.82
Murzim,95.675,-17.956,153,-3.95,-0.24
Muliphein,103.197,-15.633,124,-2.30,-0.07
Phurud,95.078,-30.063,102,-3.02,-0.18
Aludra,111.024,-29.303,620,-7.51,-0.18
Gomeisa,111.788,8.289,52,-0.70,-0.09
Alsuhail,136.999,-43.433,175,-3.99,1.66
Koo She,130.806,-33.186,67,-1.17,0.01
Tureis,121.886,-24.304,56,-0.75,0.18
Alchiba,182.531,-24.729,15,3.17,0.33
Algorab,187.466,-16.516,27,1.37,0.01
Minelauva,188.436,3.398,60,-0.35,1.50
Vindemiatrix,195.545,10.959,31,0.37,1.01
Auva,193.901,3.397,11.8,3.53,0.52
Porrima,190.415,-1.449,12,2.38,0.36
Zubenelgenubi,222.720,-16.042,23,0.77,0.14
Brachium,233.673,-25.282,86,-1.02,1.17
Kang,223.267,-10.539,52,-0.28,0.13`.split("\n").map(line => {
  const [name, ...nums] = line.split(",");
  const [ra, dec, dist, absMag, bv] = nums.map(Number);
  return { name: name.trim(), ra, dec, dist: Math.max(dist, 0.001), absMag, bv, isCatalog: true };
});

const STAR_CATALOG = [...RAW_STARS, ...EXTRA_STARS];

// ── SPIRAL ARM MODEL ──────────────────────────────────────────
// 4 logarithmic spiral arms + local spur
// Each arm defined by: initial angle (at reference radius), and color tint
const SPIRAL_ARMS = [
  { theta0: 0,      name: "Perseus",           boost: 1.0 },
  { theta0: Math.PI * 0.5,  name: "Sagittarius-Carina", boost: 1.2 },
  { theta0: Math.PI,       name: "Scutum-Centaurus",  boost: 1.1 },
  { theta0: Math.PI * 1.5, name: "Norma-Outer",       boost: 0.8 },
];
const REF_RADIUS = 4000; // Reference radius for spiral definition (pc)

function spiralArmAngle(R) {
  // Logarithmic spiral: theta = theta0 + ln(R/R_ref) / tan(pitch)
  return Math.log(Math.max(R, 100) / REF_RADIUS) / Math.tan(ARM_PITCH);
}

function nearestArmDistance(R, theta) {
  let minDist = Infinity;
  for (const arm of SPIRAL_ARMS) {
    const armAngle = arm.theta0 + spiralArmAngle(R);
    // Angular distance, wrapped
    let dTheta = theta - armAngle;
    dTheta = ((dTheta % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    const arcDist = Math.abs(dTheta) * R; // Linear distance at this radius
    const weighted = arcDist / arm.boost;
    if (weighted < minDist) minDist = weighted;
  }
  return minDist;
}

// ── GALACTIC DENSITY MODEL ────────────────────────────────────
function galacticDensity(gcX, gcY, gcZ) {
  const R = Math.sqrt(gcX * gcX + gcY * gcY);
  const z = gcZ;

  // Base exponential disk
  let density = Math.exp(-R / DISK_SCALE_H) * Math.exp(-Math.abs(z) / DISK_SCALE_Z);

  // Spiral arm enhancement
  const theta = Math.atan2(gcY, gcX);
  const armDist = nearestArmDistance(R, theta);
  const armFactor = 1.0 + 2.5 * Math.exp(-(armDist * armDist) / (ARM_WIDTH * ARM_WIDTH * 2));
  density *= armFactor;

  // Galactic bulge
  const bulgeR = Math.sqrt(R * R + z * z * 4); // Oblate
  density += 3.0 * Math.exp(-(bulgeR * bulgeR) / (BULGE_RADIUS * BULGE_RADIUS));

  return density;
}

function dustExtinction(gcX, gcY, gcZ) {
  const R = Math.sqrt(gcX * gcX + gcY * gcY);
  const z = gcZ;
  return Math.exp(-R / (DISK_SCALE_H * 1.2)) * Math.exp(-Math.abs(z) / DUST_SCALE_Z) * 0.5;
}

// ── MILKY WAY BRIGHTNESS MAP ──────────────────────────────────
// Pre-compute brightness for each (l, b) direction from observer
// Returns Float32Array indexed by [l_index * B_STEPS + b_index]
const L_STEPS = 360; // 1° resolution in longitude
const B_STEPS = 180;  // 1° resolution in latitude
const RAY_STEPS = 40; // Integration steps per ray
const RAY_MAX = 15000; // Max distance (pc)

function computeMilkyWayMap(obsGCx, obsGCy, obsGCz) {
  const map = new Float32Array(L_STEPS * B_STEPS);
  const dustMap = new Float32Array(L_STEPS * B_STEPS);

  for (let li = 0; li < L_STEPS; li++) {
    const l = (li / L_STEPS) * 2 * Math.PI; // galactic longitude from observer
    for (let bi = 0; bi < B_STEPS; bi++) {
      const b = ((bi / B_STEPS) - 0.5) * Math.PI; // galactic latitude from observer

      const cosB = Math.cos(b);
      // Direction in galactocentric frame
      // From observer, l=0 points toward galactic center (approximately)
      // We need the actual direction. The observer's galactic longitude defines
      // the offset from the GC center direction.
      const obsR = Math.sqrt(obsGCx * obsGCx + obsGCy * obsGCy);
      const obsTheta = Math.atan2(obsGCy, obsGCx);

      // Direction in GC frame: l=0 should point toward GC center from observer
      // Radial inward direction from observer
      const dirTheta = obsTheta + Math.PI + l; // l=0 toward center, l increases CCW
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

        const R = Math.sqrt(px*px + py*py);
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

// Bilinear interpolation for smooth MW map sampling
function sampleMWMap(map, l, b) {
  // l in [0, 2π), b in [-π/2, π/2]
  const lNorm = ((l % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const lf = (lNorm / (2 * Math.PI)) * L_STEPS;
  const bf = ((b / Math.PI) + 0.5) * B_STEPS;

  const l0 = Math.floor(lf) % L_STEPS;
  const l1 = (l0 + 1) % L_STEPS;
  const b0 = Math.max(0, Math.min(B_STEPS - 1, Math.floor(bf)));
  const b1 = Math.min(B_STEPS - 1, b0 + 1);

  const lt = lf - Math.floor(lf);
  const bt = bf - Math.floor(bf);

  const v00 = map[l0 * B_STEPS + b0];
  const v10 = map[l1 * B_STEPS + b0];
  const v01 = map[l0 * B_STEPS + b1];
  const v11 = map[l1 * B_STEPS + b1];

  return (v00 * (1 - lt) * (1 - bt) + v10 * lt * (1 - bt) +
          v01 * (1 - lt) * bt + v11 * lt * bt);
}

// ── PROCEDURAL GALACTIC STARS ─────────────────────────────────
function generateProceduralStars(count, seed) {
  const stars = [];
  let s = seed;
  const rand = () => { s = (s * 16807 + 7) % 2147483647; return s / 2147483647; };

  for (let i = 0; i < count; i++) {
    // Generate in galactocentric coordinates with realistic distribution
    const R = 1000 + rand() * 14000; // galactocentric radius
    const theta = rand() * 2 * Math.PI;

    // Prefer positions near spiral arms
    const armDist = nearestArmDistance(R, theta);
    const armProb = Math.exp(-(armDist * armDist) / (ARM_WIDTH * ARM_WIDTH * 4));
    if (rand() > 0.45 + 0.55 * armProb) { i--; continue; } // Rejection sampling (relaxed)

    const z = (rand() - 0.5) * 2 * DISK_SCALE_Z * (0.5 + rand()); // Vertical scatter
    const gcX = R * Math.cos(theta);
    const gcY = R * Math.sin(theta);
    const gcZ = z;

    // Convert to heliocentric equatorial
    const helioGalX = R_SUN - gcX; // Sun-centered galactic x (toward GC)
    const helioGalY = -gcY;
    const helioGalZ = gcZ - Z_SUN;
    const [eqX, eqY, eqZ] = galToEq(helioGalX, helioGalY, helioGalZ);

    const dist = Math.sqrt(eqX*eqX + eqY*eqY + eqZ*eqZ);
    if (dist < 3 || dist > 8000) continue; // Wider distance range

    const { ra, dec } = xyzToRaDec(eqX, eqY, eqZ);

    // Random stellar properties (weighted toward dimmer stars)
    const magRoll = rand();
    let absMag, bvColor;
    if (magRoll < 0.01)      { absMag = -4 + rand() * 3; bvColor = -0.2 + rand() * 0.3; }  // Bright giants
    else if (magRoll < 0.05) { absMag = -1 + rand() * 3; bvColor = -0.1 + rand() * 0.8; }  // Giants
    else if (magRoll < 0.15) { absMag = 1 + rand() * 3;  bvColor = 0.0 + rand() * 1.0; }   // Bright MS
    else if (magRoll < 0.40) { absMag = 3 + rand() * 3;  bvColor = 0.3 + rand() * 1.0; }   // Mid MS
    else                     { absMag = 5 + rand() * 5;  bvColor = 0.6 + rand() * 1.2; }    // Dim MS / red dwarfs

    const appMag = apparentMag(absMag, dist);
    if (appMag > 8.5) continue; // Relaxed filter - let more faint stars through

    stars.push({
      name: null,
      ra, dec, dist, absMag, bv: Math.min(2.0, bvColor),
      isCatalog: false,
    });
  }
  return stars;
}

// ── DENSE BACKGROUND STAR FIELD ───────────────────────────────
// These are NOT individually resolved — they're the "powdered sugar"
// of thousands of faint, distant stars that create sky density.
// Concentrated heavily along galactic plane for MW band reinforcement.
function generateBackgroundField(count, seed) {
  const points = [];
  let s = seed;
  const rand = () => { s = (s * 16807 + 7) % 2147483647; return s / 2147483647; };

  for (let i = 0; i < count; i++) {
    // Generate in galactic coordinates, heavily concentrated on plane
    // Galactic latitude: exponential concentration toward b=0
    const u = rand();
    const galB = (Math.random < 0.5 ? 1 : -1) * Math.pow(rand(), 0.3) * 90; // Degrees, concentrated near 0
    // Actually use a proper distribution:
    const bSign = rand() < 0.5 ? 1 : -1;
    // 70% within ±12° of plane, 20% within ±30°, 10% everywhere
    const bRoll = rand();
    let bDeg;
    if (bRoll < 0.50) bDeg = bSign * rand() * 8;          // Dense plane core
    else if (bRoll < 0.75) bDeg = bSign * (8 + rand() * 15); // Plane halo
    else if (bRoll < 0.90) bDeg = bSign * (15 + rand() * 25); // Scattered
    else bDeg = bSign * rand() * 85;                          // Everywhere (sparse)

    const galL = rand() * 360; // Uniform in longitude

    // Slight density boost toward galactic center (l ~ 0°)
    const lRad = galL * DEG;
    const centerBoost = 0.6 + 0.4 * Math.exp(-Math.pow(Math.min(galL, 360 - galL), 2) / (60 * 60));
    if (rand() > centerBoost) { i--; continue; }

    // Spiral arm boost for longitude: sample MW map if available
    // (We'll apply this at render time instead for observer-relativity)

    // Convert galactic (l, b) to equatorial (RA, Dec) for storage
    const bRad = bDeg * DEG;
    const cosB = Math.cos(bRad);
    const gx = cosB * Math.cos(lRad);
    const gy = cosB * Math.sin(lRad);
    const gz = Math.sin(bRad);
    const [eqX, eqY, eqZ] = galToEq(gx, gy, gz);
    const dec = Math.asin(Math.max(-1, Math.min(1, eqZ))) * RAD;
    let ra = Math.atan2(eqY, eqX) * RAD;
    if (ra < 0) ra += 360;

    // Brightness: mostly very faint, some moderate
    const magRoll = rand();
    let baseMag;
    if (magRoll < 0.05) baseMag = 3.5 + rand() * 1.5;       // Moderately bright
    else if (magRoll < 0.20) baseMag = 4.5 + rand() * 1.0;   // Faint-visible
    else if (magRoll < 0.50) baseMag = 5.2 + rand() * 1.0;   // Barely visible
    else baseMag = 5.8 + rand() * 1.5;                        // Sub-threshold shimmer

    // Color: slight warm bias along plane (more distant red giants mixed in)
    const bv = 0.2 + rand() * 1.3;

    points.push({ ra, dec, galL, galB: bDeg, baseMag, bv });
  }
  return points;
}

// ── EXOPLANET SYSTEMS ─────────────────────────────────────────
const EXOPLANET_SYSTEMS = [
  { star:"Proxima Centauri", planet:"Proxima Centauri b", ra:217.429, dec:-62.680, dist:1.301, atmoType:"thin_co2", atmoDesc:"Thin CO₂, possible N₂", note:"Nearest exoplanet. M-dwarf → red-tinted sky.", armNote:"Local Bubble / Orion Spur" },
  { star:"TRAPPIST-1", planet:"TRAPPIST-1e", ra:346.622, dec:-5.041, dist:12.43, atmoType:"earth_like", atmoDesc:"Possible N₂/O₂/H₂O", note:"Habitable zone, ultra-cool dwarf host.", armNote:"Local Bubble" },
  { star:"TRAPPIST-1", planet:"TRAPPIST-1f", ra:346.622, dec:-5.041, dist:12.43, atmoType:"thick_co2", atmoDesc:"Likely thicker CO₂-rich", note:"Outer HZ. Amber-hued skies.", armNote:"Local Bubble" },
  { star:"Tau Ceti", planet:"Tau Ceti e", ra:26.017, dec:-15.937, dist:3.65, atmoType:"earth_like", atmoDesc:"N₂/CO₂ mix, possible H₂O vapor", note:"Sun-like host. Familiar constellations slightly shifted.", armNote:"Local Bubble" },
  { star:"Kepler-442", planet:"Kepler-442b", ra:294.164, dec:39.247, dist:342, atmoType:"earth_like", atmoDesc:"Possible thick N₂/O₂", note:"~1,100 ly. Deep in Perseus Arm.", armNote:"Perseus Arm" },
  { star:"Ross 128", planet:"Ross 128 b", ra:176.937, dec:0.799, dist:3.37, atmoType:"thin_n2", atmoDesc:"Possibly thin N₂ envelope", note:"Quiet M-dwarf, low UV.", armNote:"Local Bubble" },
  { star:"Luyten's Star", planet:"Luyten b", ra:109.998, dec:5.228, dist:3.72, atmoType:"earth_like", atmoDesc:"Possible temperate atmosphere", note:"Red dwarf, 12 ly.", armNote:"Local Bubble" },
  { star:"Teegarden's Star", planet:"Teegarden b", ra:43.254, dec:16.878, dist:3.83, atmoType:"thin_co2", atmoDesc:"Possible thin CO₂/N₂ mix", note:"Ultracool dwarf. IR-dominated.", armNote:"Local Bubble" },
  { star:"GJ 1061", planet:"GJ 1061 d", ra:53.374, dec:-44.511, dist:3.67, atmoType:"thin_n2", atmoDesc:"Speculative thin atmosphere", note:"Faint M-dwarf, 12 ly.", armNote:"Local Bubble" },
  { star:"Kapteyn's Star", planet:"Kapteyn b", ra:77.898, dec:-44.960, dist:3.91, atmoType:"thin_co2", atmoDesc:"Ancient — minimal atmosphere", note:"~11 Gyr old system.", armNote:"Local Bubble" },
  { star:"Wolf 1061", planet:"Wolf 1061 c", ra:248.412, dec:-12.661, dist:4.31, atmoType:"thick_co2", atmoDesc:"Possibly thick CO₂ (super-Venus)", note:"Dense, hazy world.", armNote:"Local Bubble" },
  { star:"Gliese 667 C", planet:"Gliese 667 Cc", ra:259.755, dec:-34.995, dist:7.24, atmoType:"earth_like", atmoDesc:"Possible N₂/CO₂/H₂O mix", note:"Triple star system.", armNote:"Local Bubble" },
  { star:"HD 40307", planet:"HD 40307 g", ra:89.496, dec:-60.022, dist:12.83, atmoType:"thick_n2", atmoDesc:"Super-Earth, dense N₂/H₂O", note:"K-dwarf. Warm orange sun.", armNote:"Local Bubble" },
  { star:"Kepler-186", planet:"Kepler-186f", ra:295.015, dec:43.842, dist:178.5, atmoType:"earth_like", atmoDesc:"First Earth-sized HZ planet", note:"~580 ly. Constellations reshuffled.", armNote:"Orion Spur / Perseus edge" },
  { star:"Kepler-452", planet:"Kepler-452b", ra:286.803, dec:44.265, dist:556, atmoType:"thick_n2", atmoDesc:"Super-Earth, likely thick atmo", note:"\"Earth's cousin.\" 1,800 ly. Alien sky.", armNote:"Perseus Arm" },
  { star:"55 Cancri", planet:"55 Cancri e", ra:133.149, dec:28.330, dist:12.34, atmoType:"exotic", atmoDesc:"Lava world — silicate vapor / Na", note:"Ultra-hot super-Earth.", armNote:"Local Bubble" },
  { star:"Epsilon Eridani", planet:"Epsilon Eridani b", ra:53.233, dec:-9.458, dist:3.22, atmoType:"gas_giant", atmoDesc:"H₂/He — viewing from moon", note:"Young system, 10.5 ly. Sol is bright.", armNote:"Local Bubble" },
];

const ATMO_MODELS = {
  none:       { name:"No Atmosphere",    skyColor:[0,0,0],     extinction:0,    haze:0,    desc:"Vacuum — raw starlight" },
  thin_n2:    { name:"Thin N₂",          skyColor:[5,8,18],    extinction:0.08, haze:0.05, desc:"Faint indigo wash near horizon" },
  thin_co2:   { name:"Thin CO₂",         skyColor:[18,10,5],   extinction:0.12, haze:0.08, desc:"Pale butterscotch horizon glow" },
  earth_like: { name:"Earth-like N₂/O₂", skyColor:[8,14,32],   extinction:0.18, haze:0.12, desc:"Deep blue Rayleigh scattering" },
  thick_n2:   { name:"Dense N₂",         skyColor:[10,18,42],  extinction:0.30, haze:0.22, desc:"Deep azure, many dim stars lost" },
  thick_co2:  { name:"Dense CO₂",        skyColor:[35,20,8],   extinction:0.35, haze:0.28, desc:"Amber-orange haze, limited visibility" },
  gas_giant:  { name:"H₂/He (moon)",     skyColor:[12,15,22],  extinction:0.10, haze:0.06, desc:"Pale steel-blue, hydrogen scattering" },
  exotic:     { name:"Exotic/Silicate",   skyColor:[30,12,15],  extinction:0.45, haze:0.35, desc:"Ruddy haze, volcanic particulates" },
};

// ── CONSTELLATION LINES ───────────────────────────────────────
const CONSTELLATION_LINES = [
  ["Betelgeuse","Bellatrix"],["Betelgeuse","Alnilam"],["Bellatrix","Alnilam"],
  ["Alnilam","Alnitak"],["Alnilam","Mintaka"],["Alnitak","Saiph"],["Mintaka","Rigel"],
  ["Rigel","Saiph"],["Betelgeuse","Saiph"],["Bellatrix","Rigel"],
  ["Dubhe","Merak"],["Merak","Phecda"],["Phecda","Alioth"],
  ["Alioth","Mizar"],["Mizar","Alkaid"],["Phecda","Dubhe"],
  ["Antares","Dschubba"],["Antares","Larawag"],["Antares","Shaula"],["Shaula","Girtab"],["Dschubba","Girtab"],
  ["Schedar","Ruchbah"],
  ["Regulus","Denebola"],["Regulus","Zosma"],["Zosma","Denebola"],
  ["Markab","Scheat"],["Scheat","Alpheratz"],["Alpheratz","Algenib"],["Algenib","Markab"],
  ["Vega","Deneb"],["Deneb","Altair"],["Altair","Vega"],
  ["Sirius","Adhara"],["Sirius","Mirzam"],["Adhara","Wezen"],
  ["Castor","Pollux"],["Castor","Alhena"],["Pollux","Alhena"],
  ["Acrux","Mimosa"],
  ["Spica","Arcturus"],
  ["Aldebaran","Elnath"],
  ["Capella","Menkalinan"],
  ["Polaris","Kochab"],
  ["Fomalhaut","Diphda"],
];

// ── PROJECTION ────────────────────────────────────────────────
function projectStar(ra, dec, viewRa, viewDec, fov, W, H) {
  const sRa = ra * DEG, sDec = dec * DEG, vRa = viewRa * DEG, vDec = viewDec * DEG;
  const sx = Math.cos(sDec)*Math.cos(sRa), sy = Math.cos(sDec)*Math.sin(sRa), sz = Math.sin(sDec);
  const vx = Math.cos(vDec)*Math.cos(vRa), vy = Math.cos(vDec)*Math.sin(vRa), vz = Math.sin(vDec);
  const cosA = sx*vx + sy*vy + sz*vz;
  if (cosA < -0.05) return null;
  const ux = -Math.sin(vDec)*Math.cos(vRa), uy = -Math.sin(vDec)*Math.sin(vRa), uz = Math.cos(vDec);
  const rx = -Math.sin(vRa), ry = Math.cos(vRa), rz = 0;
  const dx = sx-vx, dy = sy-vy, dz = sz-vz;
  const lx = dx*rx + dy*ry + dz*rz;
  const ly = dx*ux + dy*uy + dz*uz;
  const scale = W / (2 * Math.tan(fov * DEG / 2));
  const px = lx / cosA * scale, py = -ly / cosA * scale;
  const screenX = W/2 + px, screenY = H/2 + py;
  if (screenX < -80 || screenX > W+80 || screenY < -80 || screenY > H+80) return null;
  return { x: screenX, y: screenY };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ExoSkyV2() {
  const canvasRef = useRef(null);
  const mwCanvasRef = useRef(null); // Offscreen MW canvas
  const animRef = useRef(null);
  const [selectedPlanet, setSelectedPlanet] = useState(0);
  const [viewRa, setViewRa] = useState(180);
  const [viewDec, setViewDec] = useState(10);
  const [fov, setFov] = useState(90);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showMilkyWay, setShowMilkyWay] = useState(true);
  const [showStarNames, setShowStarNames] = useState(false);
  const [showHorizon, setShowHorizon] = useState(true);
  const [highlightSol, setHighlightSol] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [atmoDensity, setAtmoDensity] = useState(1.0);
  const [mwBrightness, setMwBrightness] = useState(1.0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [dataOpen, setDataOpen] = useState(true);
  const [mwReady, setMwReady] = useState(false);

  // ── Constellation Drawing State ─────────────────────
  const [drawMode, setDrawMode] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState([]); // Stars in current constellation being drawn
  const [customConstellations, setCustomConstellations] = useState([]); // Completed constellations
  const [showCustomConstellations, setShowCustomConstellations] = useState(true);
  const [drawColor, setDrawColor] = useState("#FFA500");
  const [namingMode, setNamingMode] = useState(false);
  const [constellationName, setConstellationName] = useState("");
  const [consManagerOpen, setConsManagerOpen] = useState(false);

  const DRAW_COLORS = [
    { hex:"#FFA500", name:"Amber" },
    { hex:"#FF6B8A", name:"Rose" },
    { hex:"#2ECC71", name:"Emerald" },
    { hex:"#9B59B6", name:"Violet" },
    { hex:"#FFD43B", name:"Gold" },
    { hex:"#E74C3C", name:"Coral" },
    { hex:"#1ABC9C", name:"Teal" },
    { hex:"#FFFFFF", name:"White" },
  ];

  const isDragging = useRef(false);
  const lastMouse = useRef({ x:0, y:0 });
  const pointerDownPos = useRef({ x:0, y:0 }); // For click detection
  const starPositions = useRef([]);
  const mwMapRef = useRef(null);

  const planet = EXOPLANET_SYSTEMS[selectedPlanet];
  const atmo = ATMO_MODELS[planet.atmoType];

  // ── Procedural stars (memoized per session) ─────────
  const proceduralStars = useMemo(() => generateProceduralStars(25000, 31415), []);

  // ── Dense background field (20,000 points) ─────────
  const backgroundField = useMemo(() => generateBackgroundField(20000, 77777), []);

  const allStars = useMemo(() => [...STAR_CATALOG, ...proceduralStars], [proceduralStars]);

  // ── Observer's galactocentric position ──────────────
  const obsGC = useMemo(() => {
    const eqPos = raDecDistToXYZ(planet.ra, planet.dec, planet.dist);
    return eqXYZtoGalactocentric(eqPos[0], eqPos[1], eqPos[2]);
  }, [selectedPlanet]);

  // ── Compute Milky Way map (async-ish) ───────────────
  useEffect(() => {
    setMwReady(false);
    // Use setTimeout to avoid blocking UI
    const timer = setTimeout(() => {
      mwMapRef.current = computeMilkyWayMap(obsGC[0], obsGC[1], obsGC[2]);
      setMwReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [obsGC]);

  // ── Transform stars to observer frame ───────────────
  const transformedStars = useMemo(() => {
    const obs = raDecDistToXYZ(planet.ra, planet.dec, planet.dist);
    return allStars.map(star => {
      const pos = raDecDistToXYZ(star.ra, star.dec, star.dist);
      const rel = [pos[0]-obs[0], pos[1]-obs[1], pos[2]-obs[2]];
      const { ra, dec, dist } = xyzToRaDec(rel[0], rel[1], rel[2]);
      const appMag = apparentMag(star.absMag, dist);
      const rgb = bvToRGB(star.bv);
      const isSol = star.name === "Sol";
      return { ...star, newRa:ra, newDec:dec, newDist:dist, appMag, rgb, isSol };
    }).filter(s => s.appMag < 8.5).sort((a,b) => a.appMag - b.appMag);
  }, [selectedPlanet, allStars]);

  // ── Canvas render ───────────────────────────────────
  const render = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const t = time * 0.001;

    ctx.fillStyle = "#09090B";
    ctx.fillRect(0, 0, W, H);

    // ── MILKY WAY BAND ──────────────────────────────
    if (showMilkyWay && mwMapRef.current && mwReady) {
      const mwMap = mwMapRef.current;
      const obsR = Math.sqrt(obsGC[0]*obsGC[0] + obsGC[1]*obsGC[1]);
      const obsTheta = Math.atan2(obsGC[1], obsGC[0]);

      // For each pixel patch on screen, compute galactic coords and sample MW map
      const step = Math.max(2, Math.floor(4 * (fov / 90))); // Finer adaptive resolution
      for (let sx = 0; sx < W; sx += step) {
        for (let sy = 0; sy < H; sy += step) {
          // Reverse-project screen to RA/Dec
          const dx = (sx - W/2), dy = (sy - H/2);
          const scale = W / (2 * Math.tan(fov * DEG / 2));
          const localX = dx / scale, localY = -dy / scale;

          const vRa = viewRa * DEG, vDec = viewDec * DEG;
          const rx = -Math.sin(vRa), ry = Math.cos(vRa), rz = 0;
          const ux = -Math.sin(vDec)*Math.cos(vRa), uy = -Math.sin(vDec)*Math.sin(vRa), uz = Math.cos(vDec);
          const vx = Math.cos(vDec)*Math.cos(vRa), vy = Math.cos(vDec)*Math.sin(vRa), vz = Math.sin(vDec);

          let dirX = vx + localX * rx + localY * ux;
          let dirY = vy + localX * ry + localY * uy;
          let dirZ = vz + localX * rz + localY * uz;
          const len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
          dirX /= len; dirY /= len; dirZ /= len;

          // Convert equatorial direction to galactic
          const [gx, gy, gz] = eqToGal(dirX, dirY, dirZ);

          // Galactic latitude from direction
          const galB = Math.asin(Math.max(-1, Math.min(1, gz)));

          // Galactic longitude relative to observer toward GC
          // gx points toward GC from Sun, but we need it from observer
          // The MW map was computed with l=0 toward GC from observer
          // So we need: angle of (gx, gy) relative to (observer→GC direction in gal frame)
          // Observer→GC in Sun-centered galactic = (R_SUN - obsGC_x is not quite right...
          // Simpler: just compute the galactic longitude of the direction
          const dirToGCx = -obsGC[0], dirToGCy = -obsGC[1]; // GC from observer in GC frame
          // In Sun-centered galactic frame, direction toward GC from observer:
          const toGCinGal_x = R_SUN - obsGC[0]; // Hmm, let's think...
          // Actually the gx,gy are in Sun-centered galactic. We need observer-centered.
          // The offset is small for nearby stars. For the MW map, which uses obsGC coords,
          // we need the galactic l,b of this direction from the observer.
          // Since the galactic frame is just translated (not rotated) for the observer,
          // the direction in galactic coords is the same as from the Sun.
          // But l=0 in the MW map points from observer toward GC.
          // Standard galactic l: l = atan2(gy, gx) where gx is toward standard GC (from Sun)
          // Observer's direction toward GC differs from Sun's if observer is not at Sun.
          // For the MW map: l=0 is toward GC from observer, which is at angle obsTheta+π from observer
          const stdGalL = Math.atan2(gy, gx); // Standard galactic longitude from Sun
          // l from observer toward GC: the angle of (-obsGC[0], -obsGC[1]) in GC frame
          // In galactic frame (Sun-centered), GC is at (R_SUN, 0, -Z_SUN), normalized direction ≈ (1, 0, 0)
          // But from observer's GC position, the direction to GC center is (-obsGC[0], -obsGC[1], -obsGC[2])
          // In Sun-centered galactic frame, observer is at (gx_off, gy_off, gz_off)
          // and GC center is at (R_SUN, 0, -Z_SUN)
          // Direction from observer to GC in Sun-centered gal frame:
          // (R_SUN - gx_off, 0 - gy_off, -Z_SUN - gz_off)
          // But let's just use the GC frame: observer at obsGC, GC at (0,0,0)
          // Direction to GC in GC frame: (-obsGC[0], -obsGC[1], -obsGC[2])
          // Angle in plane: atan2(-obsGC[1], -obsGC[0]) = obsTheta + PI
          // And the MW map uses l where l=0 = toward GC from observer
          // So observerL = stdGalL - offset
          // The offset between standard gal l=0 (Sun→GC) and observer→GC
          // In Sun-centered gal frame, GC is at ~(R_SUN, 0, -Z_SUN) → angle ≈ 0
          // From observer, GC is at angle obsTheta + PI in GC frame
          // In Sun-centered galactic, observer→GC angle ≈ atan2(obs_gal_y→GC, obs_gal_x→GC)
          // This is getting complex. Simplify: for planets < 1000 pc from Sun,
          // the MW band position barely changes. The brightness changes more.
          // For distant ones (Kepler), it shifts.
          // Use: l_obs ≈ stdGalL + correction
          const eqObs = raDecDistToXYZ(planet.ra, planet.dec, planet.dist);
          const [ogx, ogy] = eqToGal(eqObs[0], eqObs[1], eqObs[2]);
          const lCorrection = Math.atan2(ogy, R_SUN + ogx) || 0;
          const obsL = ((stdGalL - lCorrection) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);

          // Sample MW map using bilinear interpolation for smooth appearance
          const brightness = sampleMWMap(mwMap.brightness, obsL, galB) * mwBrightness;
          if (brightness < 0.003) continue;

          // Color: warm white near center, cooler blue in outer regions
          const centerWeight = Math.cos(obsL) * 0.3 + 0.5; // More toward l=0
          const rCol = Math.floor(180 + 40 * centerWeight);
          const gCol = Math.floor(175 + 30 * centerWeight);
          const bCol = Math.floor(200 - 20 * centerWeight);

          // Atmospheric dimming
          let alpha = brightness * 0.45;
          if (showAtmosphere) {
            alpha *= Math.max(0.05, 1 - atmo.extinction * atmoDensity * 1.5);
          }
          if (alpha < 0.002) continue;

          ctx.fillStyle = `rgba(${rCol},${gCol},${bCol},${Math.min(alpha, 0.35)})`;
          ctx.fillRect(sx - step/2, sy - step/2, step + 0.5, step + 0.5);
        }
      }

      // Soften with a slight blur pass using larger patches
      // (The chunky pixel look is intentional at this resolution, but add some glow)
    }

    // ── DENSE BACKGROUND STAR FIELD ─────────────────
    // Thousands of tiny dots, heavily concentrated along MW band
    // These use a fast path: no arc(), no glow, just fillRect
    {
      const extinctionMod = showAtmosphere ? atmo.extinction * atmoDensity * 2.5 : 0;
      let bgCount = 0;
      const bgMax = 12000;
      for (let i = 0; i < backgroundField.length && bgCount < bgMax; i++) {
        const bg = backgroundField[i];

        // For nearby planets, these directions barely shift, so use catalog RA/Dec directly
        // For distant planets, apply a quick galactic-latitude correction
        // based on the observer's offset from the Sun
        let useRa = bg.ra, useDec = bg.dec;

        // Quick visibility check: skip stars far from view center
        let dRa = useRa - viewRa;
        if (dRa > 180) dRa -= 360; if (dRa < -180) dRa += 360;
        const halfFov = fov * 0.6;
        if (Math.abs(dRa) > halfFov || Math.abs(useDec - viewDec) > halfFov) continue;

        const p = projectStar(useRa, useDec, viewRa, viewDec, fov, W, H);
        if (!p) continue;

        // Effective magnitude with extinction and MW-position boost
        let eMag = bg.baseMag + extinctionMod;

        // Boost stars that sit in bright MW regions (use MW map for density)
        if (mwMapRef.current && mwReady) {
          const lNorm = ((bg.galL / 360) * L_STEPS) | 0;
          const bNorm = (((bg.galB + 90) / 180) * B_STEPS) | 0;
          if (lNorm >= 0 && lNorm < L_STEPS && bNorm >= 0 && bNorm < B_STEPS) {
            const mwDensity = mwMapRef.current.brightness[lNorm * B_STEPS + bNorm];
            eMag -= mwDensity * 1.5; // Brighter in denser regions
          }
        }

        if (eMag > 7.5) continue;

        const alpha = Math.min(0.8, Math.max(0.04, (7.5 - eMag) / 7.0));
        const [r, g, b] = bvToRGB(bg.bv);

        // Tiny twinkle
        const tw = ((Math.sin(t * 0.7 + i * 0.37) * 0.5 + 0.5) * 0.3 + 0.7);
        const finalAlpha = alpha * tw;

        if (finalAlpha < 0.02) continue;

        // Size: most are sub-pixel, some are 1-2px
        const size = eMag < 4.5 ? 1.5 : eMag < 5.5 ? 1.0 : 0.7;

        ctx.fillStyle = `rgba(${r},${g},${b},${finalAlpha})`;
        ctx.fillRect(p.x - size * 0.5, p.y - size * 0.5, size, size);
        bgCount++;
      }
    }

    // ── ATMOSPHERIC SKY GRADIENT ────────────────────
    if (showAtmosphere && atmo.extinction > 0) {
      const [sr, sg, sb] = atmo.skyColor;
      const d = atmoDensity;
      const grad = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2, Math.max(W,H)*0.7);
      grad.addColorStop(0, `rgba(${sr},${sg},${sb},${0.02*d})`);
      grad.addColorStop(0.6, `rgba(${sr},${sg},${sb},${0.06*d})`);
      grad.addColorStop(1, `rgba(${sr},${sg},${sb},${0.15*d})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,W,H);
      if (atmo.haze > 0) {
        const hg = ctx.createLinearGradient(0,H*0.5,0,H);
        hg.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
        hg.addColorStop(1, `rgba(${sr},${sg},${sb},${atmo.haze*d*0.5})`);
        ctx.fillStyle = hg;
        ctx.fillRect(0,0,W,H);
      }
    }

    // ── HORIZON LINE & GROUND PLANE ────────────────
    if (showHorizon) {
      // The horizon represents altitude = 0° from the planet surface
      // We render it as a dec-based line (simplified local horizon)
      const horizonDec = 0; // Horizon at declination 0° (simplified equatorial)
      
      // Project horizon line across the full RA range
      const horizPts = [];
      for (let ra = viewRa - fov * 0.8; ra <= viewRa + fov * 0.8; ra += fov / 60) {
        const p = projectStar(((ra % 360) + 360) % 360, horizonDec, viewRa, viewDec, fov, W, H);
        if (p) horizPts.push(p);
      }
      
      if (horizPts.length > 1) {
        // Ground plane below horizon — dark gradient
        const lowestY = Math.max(...horizPts.map(p => p.y));
        if (lowestY < H) {
          const [sr, sg, sb] = showAtmosphere ? atmo.skyColor : [20, 18, 15];
          const groundGrad = ctx.createLinearGradient(0, Math.min(...horizPts.map(p => p.y)), 0, H);
          groundGrad.addColorStop(0, `rgba(${Math.floor(sr*0.15)},${Math.floor(sg*0.12)},${Math.floor(sb*0.1)},0.7)`);
          groundGrad.addColorStop(0.3, `rgba(${Math.floor(sr*0.08)},${Math.floor(sg*0.06)},${Math.floor(sb*0.04)},0.85)`);
          groundGrad.addColorStop(1, `rgba(6,5,4,0.95)`);
          
          // Fill below horizon using the projected points
          ctx.beginPath();
          ctx.moveTo(horizPts[0].x, horizPts[0].y);
          for (let i = 1; i < horizPts.length; i++) ctx.lineTo(horizPts[i].x, horizPts[i].y);
          ctx.lineTo(W + 10, horizPts[horizPts.length - 1].y);
          ctx.lineTo(W + 10, H + 10);
          ctx.lineTo(-10, H + 10);
          ctx.lineTo(-10, horizPts[0].y);
          ctx.closePath();
          ctx.fillStyle = groundGrad;
          ctx.fill();
        }

        // Atmospheric horizon glow — warm band just above the horizon
        if (showAtmosphere && atmo.extinction > 0) {
          const [sr, sg, sb] = atmo.skyColor;
          const d = atmoDensity;
          for (let i = 0; i < horizPts.length - 1; i++) {
            const x1 = horizPts[i].x, y1 = horizPts[i].y;
            const x2 = horizPts[i + 1].x, y2 = horizPts[i + 1].y;
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            
            // Subtle glow above horizon
            const glowH = 30 * d;
            const glow = ctx.createLinearGradient(mx, my - glowH, mx, my + 4);
            glow.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
            glow.addColorStop(0.6, `rgba(${sr},${sg},${sb},${0.03 * d})`);
            glow.addColorStop(1, `rgba(${sr},${sg},${sb},${0.08 * d})`);
            ctx.fillStyle = glow;
            ctx.fillRect(Math.min(x1, x2) - 2, my - glowH, Math.abs(x2 - x1) + 4, glowH + 4);
          }
        }

        // The horizon line itself
        ctx.beginPath();
        ctx.moveTo(horizPts[0].x, horizPts[0].y);
        for (let i = 1; i < horizPts.length; i++) {
          // Smooth curve through points
          if (i < horizPts.length - 1) {
            const xc = (horizPts[i].x + horizPts[i + 1].x) / 2;
            const yc = (horizPts[i].y + horizPts[i + 1].y) / 2;
            ctx.quadraticCurveTo(horizPts[i].x, horizPts[i].y, xc, yc);
          } else {
            ctx.lineTo(horizPts[i].x, horizPts[i].y);
          }
        }
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Brighter center section of the horizon line (atmospheric perspective)
        const centerIdx = Math.floor(horizPts.length / 2);
        const spread = Math.floor(horizPts.length * 0.3);
        ctx.beginPath();
        const startI = Math.max(0, centerIdx - spread);
        const endI = Math.min(horizPts.length - 1, centerIdx + spread);
        ctx.moveTo(horizPts[startI].x, horizPts[startI].y);
        for (let i = startI + 1; i <= endI; i++) ctx.lineTo(horizPts[i].x, horizPts[i].y);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 3;
        ctx.stroke();

        // "HORIZON" label
        if (fov < 120) {
          const labelPt = horizPts[Math.floor(horizPts.length * 0.85)];
          if (labelPt && labelPt.y > 20 && labelPt.y < H - 20) {
            ctx.font = '6px "Space Grotesk", sans-serif';
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.textAlign = "center";
            ctx.letterSpacing = "3px";
            ctx.fillText("H O R I Z O N", labelPt.x, labelPt.y - 6);
          }
        }
      }
    }

    // ── COORDINATE GRID ─────────────────────────────
    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 0.5;
      for (let ra = 0; ra < 360; ra += 30) {
        const pts = [];
        for (let dec = -80; dec <= 80; dec += 5) {
          const p = projectStar(ra, dec, viewRa, viewDec, fov, W, H);
          if (p) pts.push(p);
        }
        if (pts.length > 1) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); }
      }
      for (let dec = -60; dec <= 60; dec += 30) {
        const pts = [];
        for (let ra = 0; ra <= 360; ra += 5) {
          const p = projectStar(ra, dec, viewRa, viewDec, fov, W, H);
          if (p) pts.push(p);
        }
        if (pts.length > 1) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); }
      }
    }

    // ── CONSTELLATION LINES ─────────────────────────
    if (showConstellations) {
      const starMap = {};
      transformedStars.forEach(s => { if (s.name) starMap[s.name] = s; });
      ctx.strokeStyle = "rgba(0,212,255,0.05)";
      ctx.lineWidth = 0.7;
      ctx.setLineDash([3,5]);
      CONSTELLATION_LINES.forEach(([a,b]) => {
        const sa = starMap[a], sb = starMap[b];
        if (!sa || !sb) return;
        const pa = projectStar(sa.newRa, sa.newDec, viewRa, viewDec, fov, W, H);
        const pb = projectStar(sb.newRa, sb.newDec, viewRa, viewDec, fov, W, H);
        if (!pa || !pb) return;
        if (Math.sqrt((pa.x-pb.x)**2+(pa.y-pb.y)**2) > W*0.8) return;
        ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(pb.x,pb.y); ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // ── STARS ────────────────────────────────────────
    const positions = [];
    const maxStars = 8000; // Performance cap
    let count = 0;

    for (const s of transformedStars) {
      if (count >= maxStars) break;
      const p = projectStar(s.newRa, s.newDec, viewRa, viewDec, fov, W, H);
      if (!p) continue;

      let eMag = s.appMag;
      if (showAtmosphere) eMag += atmo.extinction * atmoDensity * 2.5;
      if (eMag > 7.2) continue;

      const [r,g,b] = s.rgb;

      // ── FAST PATH for dim procedural stars ──────
      if (!s.isCatalog && eMag > 4.0) {
        const alpha = Math.min(0.7, Math.max(0.06, (7.2 - eMag) / 5.0));
        const sz = eMag < 5.0 ? 1.4 : eMag < 6.0 ? 1.0 : 0.7;
        const tw = Math.sin(t*1.1 + s.newRa*0.13) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * tw})`;
        ctx.fillRect(p.x - sz*0.5, p.y - sz*0.5, sz, sz);
        count++;
        continue;
      }

      const magScale = Math.max(0.4, 4.5 - eMag * 0.5);
      const tw = Math.sin(t*1.3 + s.newRa*0.1 + (s.newDec||0)*0.05) * 0.15 + 0.85;
      const radius = magScale * tw * (s.isCatalog ? 1 : 0.85);
      const alpha = Math.min(1, Math.max(0.15, 1 - eMag/7));

      // Glow for bright stars
      if (eMag < 2.0 && s.isCatalog) {
        const glowR = radius * (eMag < 0 ? 14 : 7);
        const glow = ctx.createRadialGradient(p.x,p.y,radius, p.x,p.y,glowR);
        glow.addColorStop(0, `rgba(${r},${g},${b},${0.12*alpha})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(p.x,p.y,glowR,0,Math.PI*2); ctx.fillStyle=glow; ctx.fill();
      }

      // Sol highlight
      if (s.isSol && highlightSol) {
        const pr = 8 + Math.sin(t*2)*3;
        ctx.beginPath(); ctx.arc(p.x,p.y,pr,0,Math.PI*2);
        ctx.strokeStyle = `rgba(255,215,59,${0.25+Math.sin(t*2)*0.1})`;
        ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '7px "Space Grotesk", sans-serif';
        ctx.fillStyle = "rgba(255,215,59,0.6)";
        ctx.textAlign = "center";
        ctx.fillText("SOL", p.x, p.y-14);
      }

      // Star point
      ctx.beginPath(); ctx.arc(p.x,p.y,radius,0,Math.PI*2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();

      // Diffraction spikes
      if (eMag < 0.5 && s.isCatalog) {
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.1*alpha})`;
        ctx.lineWidth = 0.5;
        const sl = radius*4;
        ctx.beginPath();
        ctx.moveTo(p.x-sl,p.y); ctx.lineTo(p.x+sl,p.y);
        ctx.moveTo(p.x,p.y-sl); ctx.lineTo(p.x,p.y+sl);
        ctx.stroke();
      }

      // Labels
      if (showStarNames && s.name && eMag < 3.5 && fov < 130 && s.isCatalog) {
        ctx.font = '8px "DM Sans", sans-serif';
        ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.textAlign = "center";
        ctx.fillText(s.name, p.x, p.y + radius + 12);
      }

      if (s.isCatalog || (drawMode && eMag < 5.5)) positions.push({ ...s, screenX:p.x, screenY:p.y, effectiveMag:eMag });
      count++;
    }
    starPositions.current = positions;

    // ── DRAW MODE HOVER INDICATOR ─────────────────
    if (drawMode && hoveredStar) {
      const hp = projectStar(hoveredStar.newRa, hoveredStar.newDec, viewRa, viewDec, fov, W, H);
      if (hp) {
        const pulse = Math.sin(t * 4) * 0.3 + 0.7;
        // Outer ring
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 10 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = drawColor + "66";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Inner target
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 3, 0, Math.PI * 2);
        ctx.strokeStyle = drawColor + "AA";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Preview line from last drawn star
        if (currentDrawing.length > 0) {
          const lastStar = currentDrawing[currentDrawing.length - 1];
          const lp = projectStar(lastStar.newRa, lastStar.newDec, viewRa, viewDec, fov, W, H);
          if (lp) {
            ctx.beginPath();
            ctx.moveTo(lp.x, lp.y);
            ctx.lineTo(hp.x, hp.y);
            ctx.strokeStyle = drawColor + "33";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    // ── CUSTOM CONSTELLATIONS ───────────────────────
    if (showCustomConstellations) {
      for (const cons of customConstellations) {
        if (!cons.visible) continue;
        const pts = cons.stars.map(s => projectStar(s.newRa, s.newDec, viewRa, viewDec, fov, W, H)).filter(Boolean);
        if (pts.length < 2) continue;

        // Parse color for alpha variants
        const cc = cons.color;

        // Lines
        ctx.strokeStyle = cc + "55"; // ~33% alpha
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          const dist = Math.sqrt((pts[i].x-pts[i-1].x)**2 + (pts[i].y-pts[i-1].y)**2);
          if (dist > W * 0.8) continue; // Skip wrap-around lines
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Star nodes
        for (const pt of pts) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = cc + "44";
          ctx.fill();
          ctx.strokeStyle = cc + "88";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Label at centroid
        const centP = projectStar(cons.centRa, cons.centDec, viewRa, viewDec, fov, W, H);
        if (centP && fov < 130) {
          ctx.font = '10px "Space Grotesk", sans-serif';
          ctx.fillStyle = cc + "66";
          ctx.textAlign = "center";
          ctx.fillText(cons.name.toUpperCase(), centP.x, centP.y - 16);
        }
      }
    }

    // ── IN-PROGRESS DRAWING ─────────────────────────
    if (drawMode && currentDrawing.length > 0) {
      const pts = currentDrawing.map(s => projectStar(s.newRa, s.newDec, viewRa, viewDec, fov, W, H)).filter(Boolean);

      if (pts.length >= 2) {
        // Lines
        ctx.strokeStyle = drawColor + "77";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Nodes with pulsing rings
      for (let i = 0; i < pts.length; i++) {
        if (!pts[i]) continue;
        const pulse = Math.sin(t * 3 + i * 0.5) * 0.3 + 0.7;
        // Outer ring
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 6 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = drawColor + "55";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Inner dot
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = drawColor + "AA";
        ctx.fill();
        // Number
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillStyle = drawColor + "88";
        ctx.textAlign = "center";
        ctx.fillText(`${i + 1}`, pts[i].x, pts[i].y - 10);
      }

      // Draw mode status text
      ctx.font = '9px "Space Grotesk", sans-serif';
      ctx.fillStyle = drawColor + "88";
      ctx.textAlign = "center";
      ctx.fillText(`DRAWING: ${currentDrawing.length} STAR${currentDrawing.length !== 1 ? 'S' : ''} SELECTED`, W / 2, 24);
      ctx.font = '7px "DM Sans", sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillText("Click stars to connect · Esc to cancel", W / 2, 38);
    } else if (drawMode) {
      ctx.font = '9px "Space Grotesk", sans-serif';
      ctx.fillStyle = drawColor + "88";
      ctx.textAlign = "center";
      ctx.fillText("CONSTELLATION DRAWING MODE", W / 2, 24);
      ctx.font = '7px "DM Sans", sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillText("Click a star to begin", W / 2, 38);
    }

    // ── HUD OVERLAYS ────────────────────────────────
    // FOV
    ctx.font = '16px "Space Grotesk", sans-serif';
    ctx.fillStyle = "rgba(0,212,255,0.3)";
    ctx.textAlign = "right";
    ctx.fillText(`${fov}°`, W-18, H-30);
    ctx.font = '7px "DM Sans", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillText("FIELD OF VIEW", W-18, H-18);

    // Star count
    ctx.textAlign = "left";
    ctx.font = '7px "Space Grotesk", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillText(`${count} STARS IN VIEW`, 18, H-18);

    // Milky Way status
    if (showMilkyWay && !mwReady) {
      ctx.font = '9px "Space Grotesk", sans-serif';
      ctx.fillStyle = "rgba(255,165,0,0.5)";
      ctx.textAlign = "center";
      ctx.fillText("COMPUTING GALACTIC STRUCTURE...", W/2, H-18);
    }

    animRef.current = requestAnimationFrame(render);
  }, [viewRa, viewDec, fov, showConstellations, showAtmosphere, showGrid, showMilkyWay, highlightSol, transformedStars, atmo, atmoDensity, mwBrightness, mwReady, obsGC, selectedPlanet, planet, backgroundField, drawMode, currentDrawing, customConstellations, showCustomConstellations, drawColor, hoveredStar, showStarNames, showHorizon]);

  // ── Canvas setup ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(render);
    return () => { window.removeEventListener("resize", resize); if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [render]);

  // ── Keyboard shortcuts ─────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (namingMode) { setNamingMode(false); setConstellationName(""); }
        else if (drawMode) cancelDrawing();
      }
      if (e.key === 'Enter' && namingMode && constellationName.trim()) saveConstellation();
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && drawMode && !namingMode) { e.preventDefault(); undoLastStar(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawMode, namingMode, constellationName, currentDrawing]);

  // ── Mouse interaction ───────────────────────────────
  const onDown = e => {
    isDragging.current = true;
    lastMouse.current = {x:e.clientX,y:e.clientY};
    pointerDownPos.current = {x:e.clientX,y:e.clientY};
  };
  const onMove = e => {
    const mx = e.clientX, my = e.clientY;
    let cl = null, cd = 18;
    starPositions.current.forEach(s => { const d = Math.sqrt((s.screenX-mx)**2+(s.screenY-my)**2); if(d<cd){cl=s;cd=d;} });
    setHoveredStar(cl);
    if (!isDragging.current) return;
    // Only drag the view if NOT in draw mode, or if moved enough to be a drag
    const dx = mx - lastMouse.current.x, dy = my - lastMouse.current.y;
    lastMouse.current = {x:mx,y:my};
    const totalDist = Math.sqrt((mx-pointerDownPos.current.x)**2 + (my-pointerDownPos.current.y)**2);
    if (drawMode && totalDist < 8) return; // Don't drag yet in draw mode until threshold
    const sens = fov / 800;
    setViewRa(p => (p - dx*sens + 360) % 360);
    setViewDec(p => Math.max(-89, Math.min(89, p + dy*sens)));
  };
  const onUp = e => {
    const mx = e.clientX, my = e.clientY;
    const totalDist = Math.sqrt((mx-pointerDownPos.current.x)**2 + (my-pointerDownPos.current.y)**2);

    // If in draw mode and this was a click (not a drag), add star to constellation
    if (drawMode && totalDist < 8 && !namingMode) {
      let closest = null, closestDist = 24; // Slightly wider hit area in draw mode
      starPositions.current.forEach(s => {
        const d = Math.sqrt((s.screenX-mx)**2+(s.screenY-my)**2);
        if(d<closestDist){closest=s;closestDist=d;}
      });
      if (closest) {
        // Don't add the same star twice in a row
        const last = currentDrawing[currentDrawing.length - 1];
        if (!last || last.newRa !== closest.newRa || last.newDec !== closest.newDec) {
          setCurrentDrawing(prev => [...prev, {
            name: closest.name || `Star (${closest.newRa.toFixed(1)}°, ${closest.newDec.toFixed(1)}°)`,
            newRa: closest.newRa,
            newDec: closest.newDec,
            appMag: closest.appMag,
            rgb: closest.rgb,
          }]);
        }
      }
    }

    isDragging.current = false;
  };
  const onWheel = e => { e.preventDefault(); setFov(p => Math.max(10, Math.min(160, p + (e.deltaY > 0 ? 5 : -5)))); };

  // ── Constellation drawing actions ───────────────────
  const undoLastStar = () => setCurrentDrawing(prev => prev.slice(0, -1));

  const cancelDrawing = () => {
    setCurrentDrawing([]);
    setDrawMode(false);
    setNamingMode(false);
    setConstellationName("");
  };

  const finishDrawing = () => {
    if (currentDrawing.length < 2) return;
    setNamingMode(true);
    setConstellationName("");
  };

  const saveConstellation = () => {
    if (!constellationName.trim() || currentDrawing.length < 2) return;
    const centRa = currentDrawing.reduce((s,c) => s+c.newRa, 0) / currentDrawing.length;
    const centDec = currentDrawing.reduce((s,c) => s+c.newDec, 0) / currentDrawing.length;
    setCustomConstellations(prev => [...prev, {
      id: Date.now(),
      name: constellationName.trim(),
      stars: [...currentDrawing],
      color: drawColor,
      visible: true,
      planetIndex: selectedPlanet,
      centRa, centDec,
    }]);
    setCurrentDrawing([]);
    setNamingMode(false);
    setConstellationName("");
    setDrawMode(false);
  };

  const deleteConstellation = (id) => setCustomConstellations(prev => prev.filter(c => c.id !== id));
  const toggleConstellation = (id) => setCustomConstellations(prev => prev.map(c => c.id === id ? {...c, visible: !c.visible} : c));

  const exportConstellations = () => {
    const data = customConstellations.map(c => ({
      name: c.name,
      color: c.color,
      planet: EXOPLANET_SYSTEMS[c.planetIndex]?.planet || "Unknown",
      stars: c.stars.map(s => ({ name: s.name, ra: s.newRa, dec: s.newDec, appMag: s.appMag })),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `exosky-constellations-${EXOPLANET_SYSTEMS[selectedPlanet].planet.replace(/\s+/g,'-')}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const findSol = () => {
    const sol = transformedStars.find(s => s.isSol);
    if (sol) { setViewRa(sol.newRa); setViewDec(sol.newDec); setFov(40); }
  };

  const solData = useMemo(() => transformedStars.find(s => s.isSol), [transformedStars]);
  const visibleCount = useMemo(() => {
    const lim = showAtmosphere ? 6.5 - atmo.extinction*atmoDensity*2.5 : 6.5;
    return transformedStars.filter(s => s.appMag < lim).length + backgroundField.filter(s => s.baseMag < lim).length;
  }, [transformedStars, backgroundField, showAtmosphere, atmo, atmoDensity]);

  // ── Galactic arm info ───────────────────────────────
  const armInfo = useMemo(() => {
    const R = Math.sqrt(obsGC[0]**2 + obsGC[1]**2);
    const theta = Math.atan2(obsGC[1], obsGC[0]);
    let closestArm = "Inter-arm region";
    let minD = Infinity;
    for (const arm of SPIRAL_ARMS) {
      const armAngle = arm.theta0 + spiralArmAngle(R);
      let dT = theta - armAngle;
      dT = ((dT % (2*Math.PI)) + 3*Math.PI) % (2*Math.PI) - Math.PI;
      const d = Math.abs(dT) * R;
      if (d < minD) { minD = d; closestArm = arm.name; }
    }
    const inArm = minD < ARM_WIDTH * 1.5;
    return {
      R: R.toFixed(0),
      closestArm,
      inArm,
      distToArm: minD.toFixed(0),
      z: obsGC[2].toFixed(0),
    };
  }, [obsGC]);

  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", background:"#09090B", position:"relative", cursor: drawMode ? "crosshair" : isDragging.current?"grabbing":"grab", fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />

      <canvas ref={canvasRef} style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onWheel={onWheel} />

      {/* ── TITLE ── */}
      <div style={{ position:"absolute",top:16,left:18,zIndex:10,pointerEvents:"none" }}>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:300,fontSize:26,letterSpacing:6,textTransform:"uppercase",color:"#FAFAFA" }}>EXOSKY</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:400,fontSize:8,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.28)",marginTop:2 }}>STELLARFORGE.TOOLS</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(0,212,255,0.6)",marginTop:6 }}>{planet.planet}</div>
        <div style={{ display:"inline-block",marginTop:8,padding:"6px 14px",fontSize:9,fontFamily:"'Space Grotesk',sans-serif",fontWeight:500,letterSpacing:2,textTransform:"uppercase",borderRadius:6,
          background: mwReady ? "rgba(0,212,255,0.08)" : "rgba(255,165,0,0.08)",
          border: mwReady ? "1px solid rgba(0,212,255,0.2)" : "1px solid rgba(255,165,0,0.2)",
          color: mwReady ? "#00D4FF" : "#FFA500",
          transition:"all 0.5s",
        }}>{mwReady ? "OBSERVING" : "COMPUTING"}</div>
      </div>

      {/* ── CONTROL PANEL ── */}
      <div style={{ position:"absolute",top:130,left:18,width:240,zIndex:10,maxHeight:"calc(100vh - 160px)",overflowY:"auto",
        background: panelOpen?"rgba(15,15,16,0.92)":"rgba(15,15,16,0.7)", border:"1px solid rgba(255,255,255,0.08)",
        backdropFilter:"blur(16px)",borderRadius:8,padding:panelOpen?"14px 18px":"8px 14px",transition:"all 0.3s" }}>
        <div onClick={()=>setPanelOpen(!panelOpen)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={SH}>OBSERVATION POINT</span>
          <span style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>{panelOpen?"▾":"▸"}</span>
        </div>
        {panelOpen && <>
          <select value={selectedPlanet} onChange={e=>{setSelectedPlanet(Number(e.target.value));setViewRa(180);setViewDec(10);}} style={SEL}>
            {EXOPLANET_SYSTEMS.map((p,i) => <option key={i} value={i}>{p.planet} ({(p.dist*3.262).toFixed(1)} ly)</option>)}
          </select>
          <div style={{marginTop:8,fontSize:8.5,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>{planet.note}</div>
          <div style={{marginTop:4,fontSize:8,color:"rgba(0,212,255,0.35)",fontFamily:"'JetBrains Mono',monospace"}}>{planet.armNote}</div>

          <div style={{...SH,marginTop:14}}>ATMOSPHERE</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            <span style={LBL}>Type</span><span style={VAL}>{atmo.name}</span>
          </div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginTop:2}}>{atmo.desc}</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,alignItems:"center"}}>
            <span style={LBL}>Density</span><span style={VAL}>{atmoDensity.toFixed(1)}×</span>
          </div>
          <input type="range" min="0" max="3" step="0.1" value={atmoDensity} onChange={e=>setAtmoDensity(Number(e.target.value))} style={{width:"100%",marginTop:4}} />

          <div style={{...SH,marginTop:14}}>MILKY WAY</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,alignItems:"center"}}>
            <span style={LBL}>Brightness</span><span style={VAL}>{mwBrightness.toFixed(1)}×</span>
          </div>
          <input type="range" min="0" max="3" step="0.1" value={mwBrightness} onChange={e=>setMwBrightness(Number(e.target.value))} style={{width:"100%",marginTop:4}} />

          <div style={{...SH,marginTop:14}}>DISPLAY</div>
          {[
            ["Milky Way Band", showMilkyWay, setShowMilkyWay],
            ["Atmosphere Effects", showAtmosphere, setShowAtmosphere],
            ["Horizon Line", showHorizon, setShowHorizon],
            ["Star Names", showStarNames, setShowStarNames],
            ["Earth Constellations", showConstellations, setShowConstellations],
            ["Coordinate Grid", showGrid, setShowGrid],
            ["Highlight Sol", highlightSol, setHighlightSol],
          ].map(([label, val, set]) => (
            <label key={label} style={CKL}>
              <input type="checkbox" checked={val} onChange={e=>set(e.target.checked)} style={CK} />{label}
            </label>
          ))}

          <button onClick={findSol} style={{...BTN,marginTop:12,width:"100%"}}>☉ FIND OUR SUN</button>

          <div style={{...SH,marginTop:14}}>CONSTELLATION DRAWER</div>
          {!drawMode ? (
            <button onClick={() => setDrawMode(true)} style={{...BTN,marginTop:8,width:"100%",background:"rgba(255,165,0,0.08)",borderColor:"rgba(255,165,0,0.25)",color:"#FFA500"}}>
              ✦ DRAW CONSTELLATION
            </button>
          ) : (
            <div style={{marginTop:6}}>
              {/* Color picker */}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                {DRAW_COLORS.map(c => (
                  <div key={c.hex} onClick={() => setDrawColor(c.hex)}
                    style={{width:18,height:18,borderRadius:4,background:c.hex,cursor:"pointer",
                      border: drawColor === c.hex ? "2px solid #fff" : "2px solid transparent",
                      opacity: drawColor === c.hex ? 1 : 0.5, transition:"all 0.15s"}} 
                    title={c.name} />
                ))}
              </div>

              {/* Star count */}
              <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:8}}>
                {currentDrawing.length === 0 ? "Click stars to connect them" :
                 `${currentDrawing.length} star${currentDrawing.length !== 1 ? 's' : ''} selected`}
              </div>

              {/* Star list */}
              {currentDrawing.length > 0 && (
                <div style={{maxHeight:80,overflowY:"auto",marginBottom:8,padding:"4px 0"}}>
                  {currentDrawing.map((s, i) => (
                    <div key={i} style={{fontSize:8,color:"rgba(255,255,255,0.35)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.8}}>
                      <span style={{color:drawColor,marginRight:6}}>{i+1}.</span>{s.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {currentDrawing.length > 0 && (
                  <button onClick={undoLastStar} style={{...BTN,flex:1,fontSize:7,padding:"5px 6px",background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)"}}>
                    ↩ UNDO
                  </button>
                )}
                {currentDrawing.length >= 2 && (
                  <button onClick={finishDrawing} style={{...BTN,flex:1,fontSize:7,padding:"5px 6px",background:"rgba(46,204,113,0.1)",borderColor:"rgba(46,204,113,0.3)",color:"#2ECC71"}}>
                    ✓ NAME IT
                  </button>
                )}
                <button onClick={cancelDrawing} style={{...BTN,flex:1,fontSize:7,padding:"5px 6px",background:"rgba(231,76,60,0.08)",borderColor:"rgba(231,76,60,0.2)",color:"#E74C3C"}}>
                  ✕ CANCEL
                </button>
              </div>
              <div style={{fontSize:7,color:"rgba(255,255,255,0.15)",marginTop:6}}>Esc to cancel · Ctrl+Z to undo</div>
            </div>
          )}

          {/* Saved constellations count */}
          {customConstellations.length > 0 && (
            <div style={{marginTop:8}}>
              <label style={CKL}>
                <input type="checkbox" checked={showCustomConstellations} onChange={e=>setShowCustomConstellations(e.target.checked)} style={CK} />
                Custom Constellations ({customConstellations.length})
              </label>
              <button onClick={() => setConsManagerOpen(!consManagerOpen)} style={{...BTN,marginTop:6,width:"100%",fontSize:7,padding:"4px 8px",background:"rgba(255,255,255,0.03)",borderColor:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.4)"}}>
                {consManagerOpen ? "▾" : "▸"} MANAGE
              </button>
            </div>
          )}

          <div style={{...SH,marginTop:14}}>NAVIGATION</div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.25)",lineHeight:1.7}}>
            Drag to look around · Scroll to zoom<br/>Hover stars for data
          </div>
        </>}
      </div>

      {/* ── DATA READOUT ── */}
      <div style={{ position:"absolute",top:16,right:18,width:250,zIndex:10,maxHeight:"calc(100vh - 80px)",overflowY:"auto",
        background:"rgba(15,15,16,0.92)",border:"1px solid rgba(255,255,255,0.08)",backdropFilter:"blur(16px)",borderRadius:8,padding:"14px 18px" }}>
        <div onClick={()=>setDataOpen(!dataOpen)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
          <span style={SH}>SYSTEM DATA</span>
          <span style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>{dataOpen?"▾":"▸"}</span>
        </div>
        {dataOpen && <>
          <DR l="Host Star" v={planet.star} vc="#FFD43B" />
          <DR l="Distance" v={`${(planet.dist*3.262).toFixed(1)} ly`} />
          <DR l="RA / Dec" v={`${planet.ra.toFixed(1)}° / ${planet.dec.toFixed(1)}°`} />

          <div style={{...SH,marginTop:12}}>GALACTIC POSITION</div>
          <DR l="Galactocentric R" v={`${armInfo.R} pc`} />
          <DR l="Height (z)" v={`${armInfo.z} pc`} />
          <DR l="Nearest Arm" v={armInfo.closestArm} vc={armInfo.inArm?"#2ECC71":"rgba(255,255,255,0.5)"} />
          <DR l="Arm Distance" v={`${armInfo.distToArm} pc`} />
          <DR l="In Arm?" v={armInfo.inArm?"Yes":"No"} vc={armInfo.inArm?"#2ECC71":"#E74C3C"} />

          <div style={{...SH,marginTop:12}}>SOL FROM HERE</div>
          {solData && <>
            <DR l="Apparent Mag" v={solData.appMag.toFixed(2)} vc="#FFD43B" />
            <DR l="Distance" v={`${(solData.newDist*3.262).toFixed(2)} ly`} />
            <DR l="Visibility" v={solData.appMag<1?"Bright star":solData.appMag<3?"Visible":solData.appMag<6?"Faint":"Invisible"} vc={solData.appMag<6?"#2ECC71":"#E74C3C"} />
          </>}

          <div style={{...SH,marginTop:12}}>SKY STATISTICS</div>
          <DR l="Catalog Stars" v={`${STAR_CATALOG.length}`} />
          <DR l="Galactic Stars" v={`${transformedStars.length}`} />
          <DR l="Background Field" v={`${backgroundField.length}`} />
          <DR l="Naked Eye" v={`${visibleCount}`} />
          <DR l="Custom Constellations" v={`${customConstellations.length}`} />
          <DR l="Extinction" v={`${(atmo.extinction*atmoDensity).toFixed(2)} mag`} />

          <div style={{...SH,marginTop:12}}>VIEW</div>
          <DR l="RA / Dec" v={`${viewRa.toFixed(1)}° / ${viewDec.toFixed(1)}°`} />
          <DR l="FOV" v={`${fov}°`} />

          {hoveredStar && <>
            <div style={{...SH,marginTop:12,color:"rgba(0,212,255,0.5)"}}>SELECTED STAR</div>
            <DR l="Name" v={hoveredStar.name || "Unnamed"} vc={`rgb(${hoveredStar.rgb.join(",")})`} />
            <DR l="Mag (here)" v={hoveredStar.appMag.toFixed(2)} />
            <DR l="Mag (Earth)" v={apparentMag(hoveredStar.absMag, hoveredStar.dist).toFixed(2)} />
            <DR l="Distance" v={`${(hoveredStar.newDist*3.262).toFixed(2)} ly`} />
            <DR l="B-V Index" v={hoveredStar.bv.toFixed(2)} />
          </>}
        </>}
      </div>

      {/* ── NAMING MODAL ── */}
      {namingMode && (
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)"}}>
          <div style={{background:"rgba(15,15,16,0.96)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"28px 32px",width:340,maxWidth:"90vw"}}>
            <div style={{...SH,marginBottom:12,fontSize:9,borderBottom:"1px solid rgba(0,212,255,0.1)",paddingBottom:8}}>NAME YOUR CONSTELLATION</div>
            
            {/* Preview line */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16}}>
              <div style={{width:40,height:2,background:drawColor,borderRadius:1}} />
              <span style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{currentDrawing.length} stars connected</span>
            </div>

            <input
              type="text"
              value={constellationName}
              onChange={e => setConstellationName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveConstellation(); }}
              placeholder="e.g. The Wanderer, Kzinti Claw..."
              autoFocus
              maxLength={40}
              style={{
                width:"100%",fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:300,
                letterSpacing:2,textTransform:"uppercase",
                background:"rgba(255,255,255,0.04)",color:"#FAFAFA",
                border:`1px solid ${drawColor}44`,borderRadius:8,
                padding:"12px 14px",outline:"none",
                transition:"border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = drawColor + "88"}
              onBlur={e => e.target.style.borderColor = drawColor + "44"}
            />

            {/* Color adjustment */}
            <div style={{display:"flex",gap:5,marginTop:14,alignItems:"center"}}>
              <span style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginRight:4}}>COLOR</span>
              {DRAW_COLORS.map(c => (
                <div key={c.hex} onClick={() => setDrawColor(c.hex)}
                  style={{width:16,height:16,borderRadius:3,background:c.hex,cursor:"pointer",
                    border: drawColor === c.hex ? "2px solid #fff" : "2px solid transparent",
                    opacity: drawColor === c.hex ? 1 : 0.4, transition:"all 0.15s"}} />
              ))}
            </div>

            {/* Star list preview */}
            <div style={{marginTop:14,maxHeight:100,overflowY:"auto",padding:"8px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              {currentDrawing.map((s, i) => (
                <div key={i} style={{fontSize:8,color:"rgba(255,255,255,0.3)",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.9}}>
                  <span style={{color:drawColor+"88",marginRight:6}}>{i+1}.</span>
                  {s.name}
                  <span style={{color:"rgba(255,255,255,0.15)",marginLeft:6}}>mag {s.appMag.toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button onClick={() => { setNamingMode(false); setConstellationName(""); }}
                style={{...BTN,flex:1,background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)"}}>
                ← BACK
              </button>
              <button onClick={saveConstellation}
                disabled={!constellationName.trim()}
                style={{...BTN,flex:2,
                  background: constellationName.trim() ? "rgba(46,204,113,0.12)" : "rgba(255,255,255,0.02)",
                  borderColor: constellationName.trim() ? "rgba(46,204,113,0.3)" : "rgba(255,255,255,0.05)",
                  color: constellationName.trim() ? "#2ECC71" : "rgba(255,255,255,0.2)",
                  cursor: constellationName.trim() ? "pointer" : "not-allowed",
                }}>
                ✦ SAVE CONSTELLATION
              </button>
            </div>
            <div style={{fontSize:7,color:"rgba(255,255,255,0.15)",marginTop:10,textAlign:"center"}}>Press Enter to save · Esc to go back</div>
          </div>
        </div>
      )}

      {/* ── CONSTELLATION MANAGER ── */}
      {consManagerOpen && customConstellations.length > 0 && (
        <div style={{position:"absolute",bottom:40,left:18,width:260,zIndex:20,
          background:"rgba(15,15,16,0.94)",border:"1px solid rgba(255,255,255,0.08)",
          backdropFilter:"blur(16px)",borderRadius:8,padding:"14px 18px",maxHeight:"40vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={SH}>YOUR CONSTELLATIONS</span>
            <span onClick={() => setConsManagerOpen(false)} style={{cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:12}}>✕</span>
          </div>
          {customConstellations.map(cons => (
            <div key={cons.id} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                <div style={{width:10,height:10,borderRadius:2,background:cons.color,flexShrink:0,opacity:cons.visible?1:0.3}} />
                <div style={{minWidth:0}}>
                  <div style={{fontSize:9,color:cons.visible?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.25)",fontFamily:"'Space Grotesk',sans-serif",fontWeight:500,letterSpacing:1,textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {cons.name}
                  </div>
                  <div style={{fontSize:7,color:"rgba(255,255,255,0.2)",fontFamily:"'JetBrains Mono',monospace"}}>
                    {cons.stars.length} stars · {EXOPLANET_SYSTEMS[cons.planetIndex]?.planet || "?"}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {/* Navigate to constellation */}
                <button onClick={() => { setViewRa(cons.centRa); setViewDec(cons.centDec); }}
                  style={{...MINI_BTN}} title="Navigate to">⌖</button>
                {/* Toggle visibility */}
                <button onClick={() => toggleConstellation(cons.id)}
                  style={{...MINI_BTN,opacity:cons.visible?1:0.4}} title={cons.visible?"Hide":"Show"}>
                  {cons.visible ? "◉" : "○"}
                </button>
                {/* Delete */}
                <button onClick={() => deleteConstellation(cons.id)}
                  style={{...MINI_BTN,color:"#E74C3C"}} title="Delete">✕</button>
              </div>
            </div>
          ))}
          {customConstellations.length > 0 && (
            <button onClick={exportConstellations} style={{...BTN,marginTop:12,width:"100%",fontSize:7,padding:"5px 10px"}}>
              ↓ EXPORT ALL (JSON)
            </button>
          )}
        </div>
      )}

      {/* ── CREDITS ── */}
      <div style={{ position:"absolute",bottom:14,left:18,zIndex:10,fontFamily:"'DM Sans',sans-serif",fontSize:7,letterSpacing:1,color:"rgba(255,255,255,0.12)",pointerEvents:"none" }}>
        © 2025–2026 JASON D. BATT, PH.D. · <span style={{color:"rgba(0,212,255,0.25)"}}>STELLARFORGE.TOOLS</span>
      </div>

      <style>{`
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,212,255,0.12)}
        *{box-sizing:border-box;margin:0;padding:0}body{margin:0;overflow:hidden}
        input[type=range]{-webkit-appearance:none;width:100%;height:2px;background:rgba(255,255,255,0.08);border-radius:1px;outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:11px;height:11px;border-radius:50%;background:#00D4FF;cursor:pointer;border:2px solid rgba(0,0,0,0.5)}
        input[type=checkbox]{accent-color:#00D4FF;width:11px;height:11px}
        select option{background:#0F0F10;color:#C8C8C8}
      `}</style>
    </div>
  );
}

// ── DATA ROW COMPONENT ────────────────────────────────────────
function DR({ l, v, vc }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",lineHeight:1.9,alignItems:"baseline"}}>
      <span style={{color:"rgba(255,255,255,0.3)",fontWeight:300,fontFamily:"'DM Sans',sans-serif",fontSize:9.5}}>{l}</span>
      <span style={{color:vc||"rgba(255,255,255,0.7)",fontWeight:500,fontFamily:"'JetBrains Mono',monospace",fontSize:9}}>{v}</span>
    </div>
  );
}

// ── STYLE TOKENS ──────────────────────────────────────────────
const SH = { fontSize:7.5,fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,letterSpacing:2.5,textTransform:"uppercase",color:"rgba(0,212,255,0.35)",marginTop:0,marginBottom:1,paddingBottom:2,borderBottom:"1px solid rgba(0,212,255,0.06)",width:"100%" };
const LBL = { fontSize:8,fontFamily:"'DM Sans',sans-serif",fontWeight:400,letterSpacing:1.2,textTransform:"uppercase",color:"rgba(255,255,255,0.35)" };
const VAL = { fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:300,color:"rgba(255,255,255,0.5)" };
const SEL = { width:"100%",marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:9,background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.1)",padding:"6px 8px",borderRadius:6,outline:"none" };
const BTN = { fontFamily:"'Space Grotesk',sans-serif",fontSize:8,fontWeight:500,letterSpacing:1.5,textTransform:"uppercase",padding:"7px 12px",border:"1px solid rgba(0,212,255,0.2)",background:"rgba(0,212,255,0.08)",color:"#00D4FF",cursor:"pointer",borderRadius:6,transition:"all 0.2s" };
const CKL = { display:"flex",alignItems:"center",gap:8,marginTop:6,fontSize:9,color:"rgba(255,255,255,0.5)",cursor:"pointer" };
const CK = { accentColor:"#00D4FF",width:11,height:11 };
const MINI_BTN = { background:"none",border:"1px solid rgba(255,255,255,0.08)",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:10,color:"rgba(255,255,255,0.4)",lineHeight:1,transition:"all 0.15s" };

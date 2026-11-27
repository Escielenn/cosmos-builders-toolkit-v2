// ---------------------------------------------------------------------------
// Golden simulator payloads (1.9 lane C, X1/X2 contract).
//
// Captured 2026-11-26 from each sim's DEFAULT state: the sim.html was loaded
// in Chromium and sent STELLARFORGE_REQUEST_STATE; the STELLARFORGE_SAVE
// payload it posted is pasted here verbatim. If a sim lane changes a default
// or a key, the extractor tests fail instead of canon silently drifting.
//
// Units, as each sim documents them in its own source:
//   tidelock  orbPeriod DAYS (√(a³/M)·365.25), ocean 0-100 %, atmDens atm, temps K
//   exoforge  period DAYS, ocean/cloud 0-100 %, atmo bar, temp K, composition
//             0-100 (% gas), rotation = visual spin multiplier (ephemeral)
//   solaris   generator settings only until lane S posts sf2System
//   rogue     preset host system + intruder settings
// ---------------------------------------------------------------------------

export const TIDELOCK_DEFAULT = {
  "parameters": {
    "starIdx": 6,
    "planetMass": 1,
    "planetRadius": 1,
    "orbDist": 0.074,
    "lockHZ": true,
    "atmDens": 1,
    "ghFactor": 0.3,
    "composition": "N2O2",
    "ocean": 60,
    "albedo": 0.3,
    "moonCount": 0,
    "showClouds": true,
    "showHab": true,
    "showGrid": false,
    "colorScale": 0
  },
  "results": {
    "starType": "M4V",
    "tSSP": 296.91983109210327,
    "tASP": 69.28129392149076,
    "tTerm": 69.28129392157534,
    "habStatus": "Habitable",
    "habPct": 14.694397459197333,
    "surfGrav": 1,
    "escVel": 11.186,
    "atmRetention": "Strong",
    "liquidWater": "Stable",
    "tidalLock": "Confirmed",
    "orbPeriod": 14.705093825814235
  }
} as const;

export const EXOFORGE_DEFAULT = {
  "parameters": {
    "radius": 1,
    "mass": 1,
    "temp": 288,
    "period": 365.25,
    "ocean": 70,
    "atmo": 1,
    "cloud": 40,
    "roughness": 0.5,
    "composition": 0,
    "ringOpacity": 0,
    "ringWidth": 1,
    "ringTilt": 25,
    "ringColor": "amber",
    "starTemp": 5778,
    "starRadius": 1,
    "rotation": 1,
    "name": "Custom World",
    "source": "User-defined"
  },
  "results": {
    "classification": "Terrestrial",
    "gravity": 1,
    "density": 5.51,
    "escapeVelocity": 11.186
  }
} as const;

export const SOLARIS_DEFAULT = {
  "parameters": {
    "starMode": "single",
    "arch": "",
    "starChoices": {
      "a": "random",
      "b": "random",
      "c": "random",
      "d": "random"
    },
    "systemName": "PRIMARIS",
    "planetCount": 5,
    "conditions": {
      "hab": false,
      "gas": false,
      "tidal": false,
      "rogue": false
    },
    "asteroidBelt": true,
    "bsep": 8,
    "csep": 12,
    "dsep": 55,
    "spdIdx": 3
  },
  "results": {
    "systemName": "",
    "starCount": 0,
    "planetCount": 0,
    "planetNames": [],
    "hasSystem": false,
    "planets": []
  }
} as const;

export const ROGUE_DEFAULT = {
  "parameters": {
    "currentSystem": "solar",
    "intruderType": "bh",
    "mass": 50,
    "dist": 12.0161,
    "speed": 4,
    "angle": 30,
    "timeScale": 1,
    "camMode": "free"
  },
  "results": {
    "systemName": "Our Solar System",
    "launched": false,
    "running": false,
    "simTime": 0,
    "habZone": [
      0.95,
      1.37
    ],
    "bodies": []
  }
} as const;


// ---------------------------------------------------------------------------
// Golden simulator payloads (1.9 lane C, X1/X2 contract).
//
// Captured 2026-11-26, re-captured 2026-11-27 after lanes E, S and T merged, from each sim's DEFAULT state: the sim.html was loaded
// in Chromium and sent STELLARFORGE_REQUEST_STATE; the STELLARFORGE_SAVE
// payload it posted is pasted here verbatim. If a sim lane changes a default
// or a key, the extractor tests fail instead of canon silently drifting.
//
// Units, as each sim documents them in its own source:
//   tidelock  orbPeriod DAYS (√(a³/M)·365.25), ocean 0-100 %, atmDens atm, temps K
//   exoforge  period DAYS, ocean/cloud 0-100 %, atmo bar, temp K, composition
//             0-100 (% gas), rotation = visual spin multiplier (ephemeral)
//   solaris   parameters.sf2System in real units (lane S; seed is random on
//             load, so tests on it are structural)
//   rogue     preset host system, results.epoch, energyError, outcomes
// Each iframe sim also lists its units in results.units (lane T).
// ---------------------------------------------------------------------------

export const TIDELOCK_DEFAULT = {
  "parameters": {
    "starIdx": 4,
    "starType": "M4V",
    "planetMass": 1,
    "planetRadius": 1,
    "orbDist": 0.09148225821395603,
    "lockHZ": true,
    "ageGyr": 5,
    "atmDens": 1,
    "ghFactor": 0.84,
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
    "tSSP": 296.56985907232576,
    "tASP": 262.0445808350478,
    "tTerm": 268.36886259499863,
    "habStatus": "Habitable",
    "habPct": 42.52323282781422,
    "surfGrav": 1,
    "escVel": 11.186,
    "atmRetention": "Retained",
    "liquidWater": "Stable",
    "tidalLock": "Locked",
    "orbPeriod": 21.073117358426078,
    "units": {
      "tSSP": "K",
      "tASP": "K",
      "tTerm": "K",
      "tDay": "K",
      "tNight": "K",
      "tSubstellarAirless": "K",
      "teq": "K",
      "orbPeriod": "d",
      "orbDistAU": "AU",
      "habPct": "%",
      "bandWidthKm": "km",
      "bandWidthDeg": "deg",
      "insolation": "S_earth",
      "escVel": "km/s",
      "surfGrav": "g",
      "bulkDensity": "g/cm3",
      "scaleHeightKm": "km",
      "lockTimescaleYr": "yr",
      "systemAgeGyr": "Gyr",
      "pressureAtm": "atm",
      "pressureBar": "bar"
    },
    "starLabel": "M4V",
    "starMass": 0.23,
    "starRadius": 0.27,
    "starLum": 0.006973364527962647,
    "starTeff": 3210,
    "orbDistAU": 0.09148225821395603,
    "insolation": 0.8332371316806209,
    "teq": 243.22782884491346,
    "tSubstellarAirless": 343.97609429903855,
    "tDay": 283.5197433406733,
    "tNight": 265.26325973261163,
    "epsilon": 0.908990548738499,
    "heatTransport": "Efficient",
    "pressureAtm": 1,
    "pressureBar": 1.01325,
    "greenhouseTau": 0.84,
    "albedo": 0.3,
    "bandWidthDeg": 81.39999999999965,
    "bandWidthKm": 9051.267028867042,
    "bandInnerDeg": 0,
    "bandOuterDeg": 81.39999999999965,
    "boilingK": 373.15,
    "collapse": false,
    "condensingGas": "N₂",
    "condensationK": 77.36,
    "retentionGas": "N₂",
    "retentionRatio": 0.07771856490021228,
    "exobaseK": 1000,
    "bulkDensity": 5.514,
    "scaleHeightKm": 7.854112903269578,
    "lockTimescaleYr": 813159.4024269657,
    "systemAgeGyr": 5,
    "starLifetimeGyr": 329.8264404187075
  }
} as const;

export const EXOFORGE_DEFAULT = {
  "parameters": {
    "radius": 1,
    "mass": 1,
    "temp": 287.6524056608248,
    "period": 365.2494515026285,
    "ocean": 70,
    "atmo": 1,
    "cloud": 40,
    "roughness": 0.5,
    "composition": 0,
    "ringOpacity": 0,
    "ringWidth": 1,
    "ringTilt": 25,
    "ringColor": "amber",
    "starTemp": 5772.000000000003,
    "starRadius": 1,
    "rotation": 1,
    "name": "Custom World",
    "source": "User-defined",
    "starMass": 1,
    "starMode": "ms",
    "orbDistAU": 1,
    "albedo": 0.3,
    "archiveTeq": null,
    "est": {}
  },
  "results": {
    "classification": "Terrestrial",
    "gravity": 1,
    "density": 5.514,
    "escapeVelocity": 11.186,
    "units": {
      "gravity": "g",
      "density": "g/cm3",
      "escapeVelocity": "km/s",
      "teq": "K",
      "surfaceTemp": "K",
      "insolation": "S_earth",
      "orbDistAU": "AU",
      "periodDays": "d",
      "starMass": "M_sun",
      "starLum": "L_sun",
      "starTeff": "K",
      "starRadius": "R_sun",
      "expectedRadius": "R_earth"
    },
    "teq": 254.57814011657177,
    "surfaceTemp": 287.6524056608248,
    "insolation": 1.0000000000000018,
    "orbDistAU": 1,
    "periodDays": 365.2494515026285,
    "starType": "G2V",
    "starMass": 1,
    "starLum": 1.0000000000000018,
    "starTeff": 5772.000000000003,
    "starRadius": 1,
    "hzZone": "In the zone",
    "hzInnerAU": 0.9509005906007747,
    "hzOuterAU": 1.6771668498058885,
    "massRadiusVerdict": "consistent",
    "expectedRadius": 1.008,
    "massRadiusZ": -0.08586928311430456,
    "ironRadius": 0.8600000000000001,
    "retention": "Retained",
    "retentionGas": "N₂",
    "liquidWater": "Possible",
    "estimated": []
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
    "csep": 20,
    "dsep": 55,
    "spdIdx": 3,
    "seed": 1457132212,
    "sf2Version": 2,
    "solarisSnapshot": {
      "v": 2,
      "name": "PRIMARIS",
      "seed": 1457132212,
      "starMode": "single",
      "arch": "single",
      "t": 0.22022857142857177,
      "sep": {
        "ab": 1,
        "c": 20,
        "d": 13.75,
        "cd": 1
      },
      "phase": {
        "ab": 5.5848563983603645,
        "c": 3.2247422064281377,
        "cd": 6.0340384954776844,
        "d": 5.7051612323510215
      },
      "stars": [
        {
          "key": "blue",
          "nameStr": "PRIMARIS A"
        }
      ],
      "planets": [
        {
          "name": "PRIMARIS-I",
          "typeKey": "ironfist",
          "band": "inner",
          "angle": 1.5398571609253384,
          "sz": 7.435447025112808,
          "tidalLock": false,
          "retrograde": false,
          "rotSpeed": 1,
          "rotAngle": 1.8499200000000005,
          "glowPh": 5.763092511798484,
          "albedo": 0.3,
          "orbitAU": 9.902731886311557,
          "moons": []
        },
        {
          "name": "PRIMARIS-II",
          "typeKey": "ocean",
          "band": "habitable",
          "angle": 0.09290042071574298,
          "sz": 8.440319221233949,
          "tidalLock": false,
          "retrograde": false,
          "rotSpeed": 1,
          "rotAngle": 1.8499200000000005,
          "glowPh": 4.188162946963347,
          "albedo": 0.3,
          "orbitAU": 13.35903932617017,
          "moons": []
        },
        {
          "name": "PRIMARIS-III",
          "typeKey": "greenhouse",
          "band": "habitable",
          "angle": 3.5639649158992617,
          "sz": 7.9898377088829875,
          "tidalLock": false,
          "retrograde": false,
          "rotSpeed": 1,
          "rotAngle": 1.8499200000000005,
          "glowPh": 0.7886391311281917,
          "albedo": 0.3,
          "orbitAU": 16.38793454382917,
          "moons": [
            {
              "r": 26.068948939442635,
              "angle": 8.056460885294705,
              "spd": 2.142851706268266,
              "sz": 1.9537518383003771
            }
          ]
        },
        {
          "name": "PRIMARIS-IV",
          "typeKey": "gasgiant",
          "band": "outer",
          "angle": 4.321352568347757,
          "sz": 23.509260310791433,
          "tidalLock": false,
          "retrograde": false,
          "rotSpeed": 1,
          "rotAngle": 1.8499200000000005,
          "glowPh": 2.981079320159456,
          "albedo": 0.34,
          "orbitAU": 26.845077011281155,
          "moons": [
            {
              "r": 36.845554143190384,
              "angle": 3.015630007763344,
              "spd": 2.317897108150646,
              "sz": 2.49959851289168
            },
            {
              "r": 45.59422597615048,
              "angle": 2.2102780999259255,
              "spd": 1.3486870999913663,
              "sz": 2.259395050816238
            },
            {
              "r": 45.44346734043211,
              "angle": 4.923582730319073,
              "spd": 1.520914701744914,
              "sz": 3.3600134323351085
            },
            {
              "r": 44.87209373898804,
              "angle": 8.345575671628733,
              "spd": 1.7239575499203057,
              "sz": 3.289291843306273
            }
          ]
        },
        {
          "name": "PRIMARIS-V",
          "typeKey": "glacial",
          "band": "remote",
          "angle": 1.698101659971894,
          "sz": 4.412375190295279,
          "tidalLock": false,
          "retrograde": false,
          "rotSpeed": 1,
          "rotAngle": 1.8499200000000005,
          "glowPh": 2.359384532281831,
          "albedo": 0.3,
          "orbitAU": 93.89469949842083,
          "moons": [
            {
              "r": 15.91255169082433,
              "angle": 6.636570138549122,
              "spd": 1.2261741853319108,
              "sz": 2.429997644852847
            }
          ]
        }
      ],
      "asteroidBelt": {
        "rAU": 20.102058168725662,
        "pts": [
          {
            "rAU": 19.007737506556623,
            "ang": 1.5948565839159214,
            "spd": 0.019998580356594176,
            "sz": 2.5658807472791523,
            "col": "rgba(122,117,73,0.52)"
          },
          {
            "rAU": 19.52581905707378,
            "ang": 0.9545541262146453,
            "spd": 0.01463474614173174,
            "sz": 2.542112067807466,
            "col": "rgba(130,131,72,0.61)"
          },
          {
            "rAU": 20.07550329945869,
            "ang": 5.661085091135249,
            "spd": 0.013525661494117231,
            "sz": 2.097404040629044,
            "col": "rgba(121,106,79,0.46)"
          },
          {
            "rAU": 21.023981823811113,
            "ang": 5.806715570620321,
            "spd": 0.014186339139472693,
            "sz": 2.095144623192027,
            "col": "rgba(138,106,84,0.54)"
          },
          {
            "rAU": 20.191804215027304,
            "ang": 4.615709115058081,
            "spd": 0.014656670699827373,
            "sz": 3.3148511247709394,
            "col": "rgba(164,128,87,0.62)"
          },
          {
            "rAU": 20.194602281513426,
            "ang": 1.5046847550811118,
            "spd": 0.011301731606479733,
            "sz": 3.82557310257107,
            "col": "rgba(126,113,73,0.70)"
          },
          {
            "rAU": 20.354232176936215,
            "ang": 3.171004556856875,
            "spd": 0.018248553164768963,
            "sz": 3.117127653211355,
            "col": "rgba(146,103,88,0.42)"
          },
          {
            "rAU": 19.801574860020583,
            "ang": 5.700167851823244,
            "spd": 0.019334921105764805,
            "sz": 3.3338939098175615,
            "col": "rgba(167,117,87,0.49)"
          },
          {
            "rAU": 20.73966671414894,
            "ang": 3.5645316121101542,
            "spd": 0.01785588448867202,
            "sz": 3.208095499081537,
            "col": "rgba(166,130,99,0.42)"
          },
          {
            "rAU": 20.93325134767551,
            "ang": 1.3333074620768477,
            "spd": 0.011162352940533311,
            "sz": 1.9933844993356615,
            "col": "rgba(166,137,76,0.70)"
          },
          {
            "rAU": 19.970084530317795,
            "ang": 1.6907996040321194,
            "spd": 0.016777123879641295,
            "sz": 3.962850494077429,
            "col": "rgba(143,108,95,0.42)"
          },
          {
            "rAU": 18.92393229352394,
            "ang": 5.207405283706944,
            "spd": 0.01411089783255011,
            "sz": 4.0893509653396904,
            "col": "rgba(159,110,71,0.43)"
          },
          {
            "rAU": 20.607268711361076,
            "ang": 5.436470280822429,
            "spd": 0.007957842903211713,
            "sz": 2.838618128327653,
            "col": "rgba(162,102,100,0.72)"
          },
          {
            "rAU": 20.164244010157717,
            "ang": 5.339038216460573,
            "spd": 0.009629549596924334,
            "sz": 2.3111715973354876,
            "col": "rgba(133,115,89,0.58)"
          },
          {
            "rAU": 20.518990611391278,
            "ang": 4.353471129484496,
            "spd": 0.013924800048116595,
            "sz": 2.28921615681611,
            "col": "rgba(165,121,90,0.38)"
          },
          {
            "rAU": 19.182375051228668,
            "ang": 2.407457760016992,
            "spd": 0.01845279118558392,
            "sz": 3.007104387972504,
            "col": "rgba(162,132,83,0.74)"
          },
          {
            "rAU": 21.085616677119837,
            "ang": 4.821040252380457,
            "spd": 0.010344796466641128,
            "sz": 2.3232454801909626,
            "col": "rgba(124,138,79,0.55)"
          },
          {
            "rAU": 20.394468099120346,
            "ang": 5.424112351586077,
            "spd": 0.010880258429795505,
            "sz": 3.6162102366797626,
            "col": "rgba(152,136,78,0.39)"
          },
          {
            "rAU": 19.422063106209126,
            "ang": 0.35648690413082074,
            "spd": 0.01723378963768482,
            "sz": 3.3770320918411016,
            "col": "rgba(158,125,91,0.35)"
          },
          {
            "rAU": 19.047037162038443,
            "ang": 5.7133359774380414,
            "spd": 0.011304302560631186,
            "sz": 3.5701399615500122,
            "col": "rgba(142,118,89,0.70)"
          },
          {
            "rAU": 21.121289276606134,
            "ang": 4.250282017123487,
            "spd": 0.017046917323023082,
            "sz": 2.3333891050424427,
            "col": "rgba(126,121,80,0.35)"
          },
          {
            "rAU": 19.45086721644756,
            "ang": 0.0994630015179194,
            "spd": 0.009817687341943384,
            "sz": 2.438657818129286,
            "col": "rgba(152,114,76,0.35)"
          },
          {
            "rAU": 19.69933910005378,
            "ang": 4.111108659995811,
            "spd": 0.016603569982107727,
            "sz": 2.1806983498390764,
            "col": "rgba(136,102,91,0.65)"
          },
          {
            "rAU": 19.99580384227532,
            "ang": 4.9842958512680084,
            "spd": 0.012579784257803112,
            "sz": 3.164258918724954,
            "col": "rgba(130,139,70,0.65)"
          },
          {
            "rAU": 20.090784466583216,
            "ang": 3.1730717414525667,
            "spd": 0.019023487153463067,
            "sz": 3.7863289299421012,
            "col": "rgba(144,110,94,0.66)"
          },
          {
            "rAU": 21.260113821001397,
            "ang": 1.1410125830361837,
            "spd": 0.012357776063028722,
            "sz": 1.5438667894341052,
            "col": "rgba(164,138,75,0.66)"
          },
          {
            "rAU": 19.989938061068813,
            "ang": 4.88437614524149,
            "spd": 0.013223439012188466,
            "sz": 2.4056356775108725,
            "col": "rgba(161,107,81,0.35)"
          },
          {
            "rAU": 20.999322180172275,
            "ang": 1.555092351212073,
            "spd": 0.015335182254668326,
            "sz": 2.928064419189468,
            "col": "rgba(135,128,74,0.69)"
          },
          {
            "rAU": 20.424691514920852,
            "ang": 0.2766304046321859,
            "spd": 0.013935882838908583,
            "sz": 1.5396573145408183,
            "col": "rgba(163,108,90,0.46)"
          },
          {
            "rAU": 20.263736784249737,
            "ang": 1.599888450054406,
            "spd": 0.018699141595512628,
            "sz": 1.6678771893493831,
            "col": "rgba(125,132,81,0.53)"
          },
          {
            "rAU": 19.4351080582048,
            "ang": 0.9778778924883735,
            "spd": 0.012753694494720549,
            "sz": 2.2254340073559433,
            "col": "rgba(134,112,87,0.61)"
          },
          {
            "rAU": 19.281709920140703,
            "ang": 0.7004047560961896,
            "spd": 0.018030216919258237,
            "sz": 1.5559652962256223,
            "col": "rgba(129,133,81,0.57)"
          },
          {
            "rAU": 19.290920348007546,
            "ang": 2.581274182430587,
            "spd": 0.007861332022584974,
            "sz": 2.4127009429503232,
            "col": "rgba(142,120,79,0.67)"
          },
          {
            "rAU": 19.45331800912714,
            "ang": 2.6591771160731104,
            "spd": 0.008371277600061148,
            "sz": 3.7053003790788352,
            "col": "rgba(156,118,74,0.61)"
          },
          {
            "rAU": 19.35535896967651,
            "ang": 2.3230065346555886,
            "spd": 0.01921509309159592,
            "sz": 1.7226738310419023,
            "col": "rgba(151,108,93,0.42)"
          },
          {
            "rAU": 19.522489235396435,
            "ang": 4.063573738280078,
            "spd": 0.011940515070222318,
            "sz": 3.2878797501325607,
            "col": "rgba(133,119,87,0.42)"
          },
          {
            "rAU": 21.15976781864378,
            "ang": 2.425287996665506,
            "spd": 0.01303067479096353,
            "sz": 3.1602185131050646,
            "col": "rgba(147,123,77,0.46)"
          },
          {
            "rAU": 20.290994622673207,
            "ang": 4.595608966404121,
            "spd": 0.012553233158309012,
            "sz": 2.89401046698913,
            "col": "rgba(165,116,72,0.65)"
          },
          {
            "rAU": 19.117214708418505,
            "ang": 3.9435558481754494,
            "spd": 0.011601762375794352,
            "sz": 1.6151360906660557,
            "col": "rgba(169,112,74,0.40)"
          },
          {
            "rAU": 20.292801840994063,
            "ang": 3.394200822745135,
            "spd": 0.008020163228735328,
            "sz": 2.3974521642085165,
            "col": "rgba(133,132,74,0.50)"
          },
          {
            "rAU": 21.157174026292804,
            "ang": 2.3152397410355534,
            "spd": 0.0136227595936507,
            "sz": 2.8917461943347007,
            "col": "rgba(122,100,87,0.52)"
          },
          {
            "rAU": 20.039857316439882,
            "ang": 3.7041327287204644,
            "spd": 0.007946455004625022,
            "sz": 2.5624128507915884,
            "col": "rgba(162,137,100,0.74)"
          },
          {
            "rAU": 20.195445088332775,
            "ang": 5.555026730863332,
            "spd": 0.008219766435213388,
            "sz": 1.9843606296926737,
            "col": "rgba(129,129,81,0.50)"
          },
          {
            "rAU": 19.02147129326037,
            "ang": 2.6152361967245317,
            "spd": 0.018777848900761458,
            "sz": 4.224318023538217,
            "col": "rgba(130,136,86,0.62)"
          },
          {
            "rAU": 19.651891424548733,
            "ang": 4.2041661492225035,
            "spd": 0.012817903661169111,
            "sz": 2.6091370722278953,
            "col": "rgba(124,127,97,0.67)"
          },
          {
            "rAU": 21.115773914668356,
            "ang": 3.5624707654135452,
            "spd": 0.01212526875641197,
            "sz": 3.216524218674749,
            "col": "rgba(141,117,71,0.65)"
          },
          {
            "rAU": 19.673552010363235,
            "ang": 4.622743418911838,
            "spd": 0.009036719163879752,
            "sz": 3.180908383335918,
            "col": "rgba(135,109,100,0.42)"
          },
          {
            "rAU": 19.43289585073472,
            "ang": 0.4464457581540327,
            "spd": 0.017288043326698244,
            "sz": 4.1599913402460515,
            "col": "rgba(143,128,74,0.72)"
          },
          {
            "rAU": 19.4170752580801,
            "ang": 3.512616148036901,
            "spd": 0.016706839951220902,
            "sz": 2.8406430578324944,
            "col": "rgba(123,103,94,0.47)"
          },
          {
            "rAU": 19.794079049347477,
            "ang": 2.758449559347557,
            "spd": 0.008033610834740103,
            "sz": 2.0539759879466146,
            "col": "rgba(160,137,72,0.40)"
          },
          {
            "rAU": 20.823270548107146,
            "ang": 5.943500211289957,
            "spd": 0.017255237970501186,
            "sz": 1.9871331676840782,
            "col": "rgba(131,102,83,0.56)"
          },
          {
            "rAU": 19.027022431176505,
            "ang": 3.4012241783856147,
            "spd": 0.013391674694605171,
            "sz": 3.3128990640398115,
            "col": "rgba(159,119,82,0.48)"
          },
          {
            "rAU": 19.68443281543307,
            "ang": 2.735674965606436,
            "spd": 0.010076462727505713,
            "sz": 2.4148556620348245,
            "col": "rgba(131,131,91,0.57)"
          },
          {
            "rAU": 20.98365907848721,
            "ang": 5.018939365534221,
            "spd": 0.011979622260667384,
            "sz": 2.6756470422260463,
            "col": "rgba(149,135,98,0.48)"
          },
          {
            "rAU": 19.46015107538556,
            "ang": 0.3031344230366005,
            "spd": 0.012215484429616482,
            "sz": 2.422984676202759,
            "col": "rgba(148,110,98,0.72)"
          },
          {
            "rAU": 21.030210093749602,
            "ang": 5.3454342543908275,
            "spd": 0.018209335300140083,
            "sz": 3.150917776627466,
            "col": "rgba(169,103,78,0.45)"
          },
          {
            "rAU": 20.165649309781386,
            "ang": 1.5075889882072921,
            "spd": 0.01258120590262115,
            "sz": 4.254104822175577,
            "col": "rgba(162,122,80,0.72)"
          },
          {
            "rAU": 20.600765427756777,
            "ang": 3.1077909821342082,
            "spd": 0.00606178579851985,
            "sz": 3.3129391924012452,
            "col": "rgba(130,108,73,0.54)"
          },
          {
            "rAU": 20.674839379980675,
            "ang": 4.545579725056288,
            "spd": 0.010709980769082904,
            "sz": 1.6054346496239305,
            "col": "rgba(168,111,96,0.41)"
          },
          {
            "rAU": 19.559883875874647,
            "ang": 3.928147796260321,
            "spd": 0.01713080269889906,
            "sz": 1.712176329223439,
            "col": "rgba(135,102,99,0.62)"
          },
          {
            "rAU": 21.23045734897485,
            "ang": 3.2111207305433083,
            "spd": 0.01627197456266731,
            "sz": 2.1529225388076156,
            "col": "rgba(167,120,94,0.72)"
          },
          {
            "rAU": 20.34675053490734,
            "ang": 6.182008252686785,
            "spd": 0.014707300890702754,
            "sz": 4.224538997048512,
            "col": "rgba(159,139,93,0.69)"
          },
          {
            "rAU": 19.53355939695883,
            "ang": 4.187726989662074,
            "spd": 0.011085881848353893,
            "sz": 2.8327683289535344,
            "col": "rgba(131,135,81,0.37)"
          },
          {
            "rAU": 19.583251212745473,
            "ang": 5.383792273609574,
            "spd": 0.012269327969290316,
            "sz": 4.1076306940522045,
            "col": "rgba(145,122,79,0.73)"
          },
          {
            "rAU": 19.75969212760763,
            "ang": 2.4656792374554986,
            "spd": 0.00889776351954788,
            "sz": 1.9171563601121306,
            "col": "rgba(140,125,100,0.62)"
          },
          {
            "rAU": 19.544589494830603,
            "ang": 2.225382270752885,
            "spd": 0.009537858002819121,
            "sz": 3.342984677525237,
            "col": "rgba(129,139,92,0.54)"
          },
          {
            "rAU": 21.19707498295272,
            "ang": 5.287049195372454,
            "spd": 0.018793398022186013,
            "sz": 1.6005071788094938,
            "col": "rgba(163,115,75,0.54)"
          },
          {
            "rAU": 20.28179966730341,
            "ang": 5.180547891039932,
            "spd": 0.016765604445245115,
            "sz": 3.7793055307120085,
            "col": "rgba(138,136,83,0.75)"
          },
          {
            "rAU": 19.732576050636613,
            "ang": 3.0644575279586865,
            "spd": 0.010157365132123232,
            "sz": 1.7180511988699436,
            "col": "rgba(145,138,77,0.50)"
          },
          {
            "rAU": 20.413336924264815,
            "ang": 1.0079809088199194,
            "spd": 0.017529174304567276,
            "sz": 1.6404074302408844,
            "col": "rgba(159,139,89,0.36)"
          },
          {
            "rAU": 20.740492400454233,
            "ang": 0.30972150749240945,
            "spd": 0.018600144797936084,
            "sz": 2.9928789969999343,
            "col": "rgba(125,111,97,0.45)"
          },
          {
            "rAU": 19.173712296147052,
            "ang": 1.9101390439798926,
            "spd": 0.006733771279454232,
            "sz": 2.330220684176311,
            "col": "rgba(128,122,83,0.61)"
          },
          {
            "rAU": 19.920472863422646,
            "ang": 1.6681818285247252,
            "spd": 0.014485546695999801,
            "sz": 1.8815987762063742,
            "col": "rgba(165,109,82,0.35)"
          },
          {
            "rAU": 21.27761952924941,
            "ang": 3.4733769549995217,
            "spd": 0.014879561129491776,
            "sz": 1.513700583949685,
            "col": "rgba(131,129,70,0.48)"
          },
          {
            "rAU": 20.81171477307208,
            "ang": 6.238824471906436,
            "spd": 0.015713976704515516,
            "sz": 2.112289553973824,
            "col": "rgba(136,106,100,0.51)"
          },
          {
            "rAU": 19.170915658714502,
            "ang": 2.8108272277570614,
            "spd": 0.00788587345648557,
            "sz": 1.6106891802046448,
            "col": "rgba(167,130,79,0.54)"
          },
          {
            "rAU": 20.051299351827108,
            "ang": 4.206291782399406,
            "spd": 0.010953609349671751,
            "sz": 2.2265165329445153,
            "col": "rgba(160,109,81,0.63)"
          },
          {
            "rAU": 20.13673778997919,
            "ang": 5.408048075549586,
            "spd": 0.006155552540905774,
            "sz": 4.364875484956428,
            "col": "rgba(138,102,98,0.55)"
          },
          {
            "rAU": 21.03724305873523,
            "ang": 1.0748890793899342,
            "spd": 0.017943652046844366,
            "sz": 4.198845847975463,
            "col": "rgba(139,113,95,0.50)"
          },
          {
            "rAU": 21.091615042618482,
            "ang": 4.493955434477829,
            "spd": 0.01908880532067269,
            "sz": 2.363309020875022,
            "col": "rgba(143,108,91,0.58)"
          }
        ]
      },
      "oort": null
    },
    "sf2System": {
      "id": "solaris-1457132212",
      "name": "PRIMARIS",
      "seed": "1457132212",
      "architecture": "single",
      "arch": "single",
      "star": {
        "name": "PRIMARIS A",
        "classification": "B",
        "spectralType": "B8V",
        "massSOL": 3.38,
        "luminositySOL": 154.88166189124811,
        "radiusSOL": 2.86,
        "temperatureK": 12300,
        "habitableZoneInnerAU": 10.930412804408501,
        "habitableZoneOuterAU": 18.855664517596388,
        "orbitRadiusAU": 0,
        "role": "host"
      },
      "stars": [
        {
          "name": "PRIMARIS A",
          "classification": "B",
          "spectralType": "B8V",
          "massSOL": 3.38,
          "luminositySOL": 154.88166189124811,
          "radiusSOL": 2.86,
          "temperatureK": 12300,
          "habitableZoneInnerAU": 10.930412804408501,
          "habitableZoneOuterAU": 18.855664517596388,
          "orbitRadiusAU": 0,
          "role": "host"
        }
      ],
      "planets": [
        {
          "name": "PRIMARIS-I",
          "type": "ironfist",
          "displayType": "Iron World",
          "band": "inner",
          "semiMajorAxisAU": 9.902731886311557,
          "eccentricity": 0,
          "orbitalPeriodYears": 16.950174792780995,
          "orbitalPeriodDays": 6191.051343063258,
          "insolationEarth": 1.5793920891263453,
          "equilibriumTempK": 285.3712423546692,
          "albedo": 0.3,
          "inHabitableZone": false,
          "hzStatus": "warm-edge",
          "stability": "stable",
          "ejected": false,
          "ejectedAtYears": null,
          "tidallyLocked": false,
          "retrograde": false,
          "moons": []
        },
        {
          "name": "PRIMARIS-II",
          "type": "ocean",
          "displayType": "Ocean World",
          "band": "habitable",
          "semiMajorAxisAU": 13.35903932617017,
          "eccentricity": 0,
          "orbitalPeriodYears": 26.55855806601919,
          "orbitalPeriodDays": 9700.51333361351,
          "insolationEarth": 0.867859742863027,
          "equilibriumTempK": 245.69714056854514,
          "albedo": 0.3,
          "inHabitableZone": true,
          "hzStatus": "habitable",
          "stability": "stable",
          "ejected": false,
          "ejectedAtYears": null,
          "tidallyLocked": false,
          "retrograde": false,
          "moons": []
        },
        {
          "name": "PRIMARIS-III",
          "type": "greenhouse",
          "displayType": "Greenhouse",
          "band": "habitable",
          "semiMajorAxisAU": 16.38793454382917,
          "eccentricity": 0,
          "orbitalPeriodYears": 36.085105621474725,
          "orbitalPeriodDays": 13180.084828243644,
          "insolationEarth": 0.5767021343529981,
          "equilibriumTempK": 221.83272085950207,
          "albedo": 0.3,
          "inHabitableZone": true,
          "hzStatus": "habitable",
          "stability": "stable",
          "ejected": false,
          "ejectedAtYears": null,
          "tidallyLocked": false,
          "retrograde": false,
          "moons": [
            {
              "name": "PRIMARIS-III moon 1"
            }
          ]
        },
        {
          "name": "PRIMARIS-IV",
          "type": "gasgiant",
          "displayType": "Gas Giant",
          "band": "outer",
          "semiMajorAxisAU": 26.845077011281155,
          "eccentricity": 0,
          "orbitalPeriodYears": 75.65517342129267,
          "orbitalPeriodDays": 27633.05209212715,
          "insolationEarth": 0.21491696138815555,
          "equilibriumTempK": 170.7917400208305,
          "albedo": 0.34,
          "inHabitableZone": false,
          "hzStatus": "cold",
          "stability": "stable",
          "ejected": false,
          "ejectedAtYears": null,
          "tidallyLocked": false,
          "retrograde": false,
          "moons": [
            {
              "name": "PRIMARIS-IV moon 1"
            },
            {
              "name": "PRIMARIS-IV moon 2"
            },
            {
              "name": "PRIMARIS-IV moon 3"
            },
            {
              "name": "PRIMARIS-IV moon 4"
            }
          ]
        },
        {
          "name": "PRIMARIS-V",
          "type": "glacial",
          "displayType": "Glacial",
          "band": "remote",
          "semiMajorAxisAU": 93.89469949842083,
          "eccentricity": 0,
          "orbitalPeriodYears": 494.88383073145803,
          "orbitalPeriodDays": 180756.31917466506,
          "insolationEarth": 0.01756781895922018,
          "equilibriumTempK": 92.67597807831622,
          "albedo": 0.3,
          "inHabitableZone": false,
          "hzStatus": "cold",
          "stability": "stable",
          "ejected": false,
          "ejectedAtYears": null,
          "tidallyLocked": false,
          "retrograde": false,
          "moons": [
            {
              "name": "PRIMARIS-V moon 1"
            }
          ]
        }
      ],
      "habitableZone": {
        "innerAU": 10.930412804408501,
        "outerAU": 18.855664517596388,
        "method": "Kopparapu et al. 2014, conservative (runaway to maximum greenhouse)"
      },
      "stabilityLimits": {
        "innerAU": 0,
        "outerAU": null,
        "method": "Holman & Wiegert 1999 eq. 1 (S-type), eq. 3 (P-type)"
      },
      "separationsAU": {
        "ab": 1,
        "c": 20,
        "d": 13.75,
        "cd": 1
      },
      "simTimeYears": 0.22022857142857177,
      "asteroidBelts": [
        {
          "innerAU": 18.89593467860212,
          "outerAU": 21.308181658849204
        }
      ],
      "units": {
        "semiMajorAxisAU": "au",
        "orbitalPeriodDays": "days",
        "orbitalPeriodYears": "yr",
        "insolationEarth": "S⊕ (Earth = 1)",
        "equilibriumTempK": "K",
        "massSOL": "solar_masses",
        "luminositySOL": "solar_lum",
        "temperatureK": "K"
      },
      "generatedAt": "2026-11-28T04:18:42.124Z"
    }
  },
  "results": {
    "systemName": "PRIMARIS",
    "starCount": 1,
    "planetCount": 5,
    "planetNames": [
      "PRIMARIS-I",
      "PRIMARIS-II",
      "PRIMARIS-III",
      "PRIMARIS-IV",
      "PRIMARIS-V"
    ],
    "hasSystem": true,
    "planets": [
      {
        "name": "PRIMARIS-I",
        "au": 9.903,
        "band": "inner",
        "stabCls": "stable",
        "inHabitableZone": false,
        "periodDays": 6191.051,
        "insolation": 1.5794,
        "teqK": 285.4,
        "hzStatus": "warm-edge",
        "ejected": false,
        "ejectedAtYears": null
      },
      {
        "name": "PRIMARIS-II",
        "au": 13.359,
        "band": "habitable",
        "stabCls": "stable",
        "inHabitableZone": true,
        "periodDays": 9700.513,
        "insolation": 0.8679,
        "teqK": 245.7,
        "hzStatus": "habitable",
        "ejected": false,
        "ejectedAtYears": null
      },
      {
        "name": "PRIMARIS-III",
        "au": 16.388,
        "band": "habitable",
        "stabCls": "stable",
        "inHabitableZone": true,
        "periodDays": 13180.085,
        "insolation": 0.5767,
        "teqK": 221.8,
        "hzStatus": "habitable",
        "ejected": false,
        "ejectedAtYears": null
      },
      {
        "name": "PRIMARIS-IV",
        "au": 26.845,
        "band": "outer",
        "stabCls": "stable",
        "inHabitableZone": false,
        "periodDays": 27633.052,
        "insolation": 0.2149,
        "teqK": 170.8,
        "hzStatus": "cold",
        "ejected": false,
        "ejectedAtYears": null
      },
      {
        "name": "PRIMARIS-V",
        "au": 93.895,
        "band": "remote",
        "stabCls": "stable",
        "inHabitableZone": false,
        "periodDays": 180756.319,
        "insolation": 0.0176,
        "teqK": 92.7,
        "hzStatus": "cold",
        "ejected": false,
        "ejectedAtYears": null
      }
    ]
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
      0.9509005906007741,
      1.6771668498058874
    ],
    "bodies": [],
    "epoch": {
      "unit": "yr",
      "reference": "launch",
      "encounterYears": null,
      "closestApproachAU": null,
      "elapsedYears": 0
    },
    "energyError": null,
    "publishMaxEnergyError": 0.001,
    "timeScale": {
      "requested": 1,
      "effective": 1
    }
  }
} as const;


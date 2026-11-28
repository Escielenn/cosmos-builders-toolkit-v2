#!/usr/bin/env python3
"""
Build public/tools/exosky/hyg-v41.bin, ExoSky's star catalogue, from the HYG
database v4.1 (David Nash, astronexus; CC BY-SA 4.0).

Source:  https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv
Licence: public/licenses/HYG-LICENSE.txt (CC BY-SA 4.0). The derived binary is
         shared under the same licence, credited in ExoSky and its science page.

Selection: every star with a usable distance (HYG writes 100000 pc for "no
parallax") that is EITHER naked-eye from Earth (V <= 6.5) OR within 100 pc of
the Sun. The first set is the sky as we know it; the second keeps faint
neighbours that become bright once the observer moves (Proxima is V 11 from
here and naked-eye from Alpha Centauri).

Layout (little-endian), stars sorted brightest-from-Earth first:
  0   char[8]   "SFHYG41\\0"
  8   uint32    n
  12  uint32    byte length of the trailing JSON
  16  float32[n] x  (pc, J2000 equatorial, +x to the equinox, +z north)
      float32[n] y
      float32[n] z
      int16[n]   absolute V magnitude x 100
      int16[n]   B-V x 1000 (32767 = unknown)
      uint32[n]  id: Hipparcos number, or 0x80000000 | HYG id when no HIP
  ... UTF-8 JSON {"names": {"<index>": [proper, bayerFlamsteedCon]}}

Usage: python3 -I scripts/exosky/build-hyg-catalogue.py <hygdata_v41.csv> <out.bin>
"""
import csv, json, struct, sys

def main(src, out):
    rows = []
    for r in csv.DictReader(open(src, newline="")):
        dist = float(r["dist"])
        mag = float(r["mag"])
        if dist >= 100000 or dist < 0:
            continue
        if not (mag <= 6.5 or dist < 100):
            continue
        hip = r["hip"].strip()
        sid = int(hip) if hip else (0x80000000 | int(r["id"]))
        ci = r["ci"].strip()
        bv = int(round(float(ci) * 1000)) if ci else 32767
        bv = max(-32768, min(32766, bv)) if bv != 32767 else bv
        absmag = int(round(float(r["absmag"]) * 100))
        bf = r["bf"].strip()
        con = r["con"].strip()
        rows.append((mag, float(r["x"]), float(r["y"]), float(r["z"]), absmag, bv, sid,
                     r["proper"].strip(), bf))
    rows.sort(key=lambda t: t[0])
    n = len(rows)
    names = {}
    for i, t in enumerate(rows):
        proper, bf = t[7], t[8]
        if proper or (bf and t[0] <= 5.0):
            names[str(i)] = [proper, bf]
    js = json.dumps({"names": names}, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    with open(out, "wb") as f:
        f.write(b"SFHYG41\0")
        f.write(struct.pack("<II", n, len(js)))
        for k in (1, 2, 3):
            f.write(struct.pack("<%df" % n, *[t[k] for t in rows]))
        f.write(struct.pack("<%dh" % n, *[t[4] for t in rows]))
        f.write(struct.pack("<%dh" % n, *[t[5] for t in rows]))
        f.write(struct.pack("<%dI" % n, *[t[6] for t in rows]))
        f.write(js)
    print(f"{n} stars, {len(names)} names, {16 + 16 * n + len(js)} bytes")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { auToScene } from "../utils/scaleAU";

interface OrbitalPathProps {
  semiMajorAxisAU: number;
  eccentricity: number;
  colorHex: string;
}

export function OrbitalPath({
  semiMajorAxisAU,
  eccentricity,
  colorHex,
}: OrbitalPathProps) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const a = auToScene(semiMajorAxisAU);
    const b = a * Math.sqrt(1 - eccentricity * eccentricity);
    const c = a * eccentricity; // focal offset

    // EllipseCurve: (centerX, centerY, xRadius, yRadius)
    // Star is at focus, so shift center by -c
    const curve = new THREE.EllipseCurve(
      -c, 0, // center offset so focus is at origin
      a, b,
      0, 2 * Math.PI,
      false,
      0
    );

    const points2D = curve.getPoints(256);
    // Convert to 3D: curve outputs (x, y) -> we map to (x, 0, y) for XZ plane
    const points3D = points2D.map(
      (p) => new THREE.Vector3(p.x, 0, p.y)
    );

    const geo = new THREE.BufferGeometry().setFromPoints(points3D);
    geo.computeVertexNormals();
    return geo;
  }, [semiMajorAxisAU, eccentricity]);

  // Compute line distances after geometry is attached so dashes render
  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances();
    }
  }, [geometry]);

  return (
    <line ref={lineRef as React.RefObject<THREE.Line>} geometry={geometry}>
      <lineDashedMaterial
        color={colorHex}
        transparent
        opacity={0.07}
        dashSize={0.4}
        gapSize={0.8}
      />
    </line>
  );
}

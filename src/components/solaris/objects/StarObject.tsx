import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StarData } from "../types";
import { starRadiusToScene, auToScene } from "../utils/scaleAU";
import { getGlowTexture } from "../utils/glowTexture";
import type { SolarisSim } from "../physics";

interface StarObjectProps {
  star: StarData;
  sim: SolarisSim;
  index: number;
  /** Largest permitted rendered radius, so the star cannot swallow its
      innermost planet. See starRadiusCapForApproach. */
  maxRadius?: number;
  onClick?: () => void;
}

export function StarObject({ star, sim, index, maxRadius, onClick }: StarObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coronaARef = useRef<THREE.Mesh>(null);
  const coronaBRef = useRef<THREE.Mesh>(null);

  const radius = starRadiusToScene(star.radiusSOL, maxRadius);

  useFrame((_state, delta) => {
    const s = sim.stars[index];
    if (groupRef.current && s) groupRef.current.position.set(auToScene(s.x), 0, auToScene(s.z));
    if (coronaARef.current) coronaARef.current.rotation.z += delta * 0.05;
    if (coronaBRef.current) coronaBRef.current.rotation.y += delta * 0.03;
  });

  return (
    <group ref={groupRef}>
      {/* Star sphere */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial color={star.colorHex} emissive={star.colorHex} emissiveIntensity={2.5} />
      </mesh>

      {/* Glow sprite (soft radial gradient — not a hard square).
          Pulled in from 6x to 4x: the halo is additive, so at 6x it washed out
          any planet on a close orbit even once the disc itself cleared it. */}
      <sprite scale={[radius * 4, radius * 4, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={star.colorHex}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Corona ring A - tilted 30deg on X */}
      <mesh ref={coronaARef} rotation={[(30 * Math.PI) / 180, 0, 0]}>
        <torusGeometry args={[radius * 1.5, 0.02, 16, 100]} />
        <meshBasicMaterial color={star.colorHex} transparent opacity={0.08} />
      </mesh>

      {/* Corona ring B - tilted -20deg on Z */}
      <mesh ref={coronaBRef} rotation={[0, 0, (-20 * Math.PI) / 180]}>
        <torusGeometry args={[radius * 1.5, 0.02, 16, 100]} />
        <meshBasicMaterial color={star.colorHex} transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

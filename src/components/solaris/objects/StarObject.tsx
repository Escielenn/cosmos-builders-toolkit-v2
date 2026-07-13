import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StarData } from "../types";
import { starRadiusToScene } from "../utils/scaleAU";
import { getGlowTexture } from "../utils/glowTexture";

interface StarObjectProps {
  star: StarData;
  onClick?: () => void;
}

export function StarObject({ star, onClick }: StarObjectProps) {
  const coronaARef = useRef<THREE.Mesh>(null);
  const coronaBRef = useRef<THREE.Mesh>(null);

  const radius = starRadiusToScene(star.radiusSOL);
  const lightIntensity = Math.min(star.luminositySOL * 1.5, 8);

  useFrame((_state, delta) => {
    if (coronaARef.current) {
      coronaARef.current.rotation.z += delta * 0.05;
    }
    if (coronaBRef.current) {
      coronaBRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Point light for scene illumination */}
      <pointLight intensity={lightIntensity} color="#ffffff" distance={0} decay={2} />

      {/* Star sphere */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          color={star.colorHex}
          emissive={star.colorHex}
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Glow sprite (soft radial gradient — not a hard square) */}
      <sprite scale={[radius * 6, radius * 6, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={star.colorHex}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Corona ring A - tilted 30deg on X */}
      <mesh ref={coronaARef} rotation={[30 * Math.PI / 180, 0, 0]}>
        <torusGeometry args={[radius * 1.5, 0.02, 16, 100]} />
        <meshBasicMaterial
          color={star.colorHex}
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Corona ring B - tilted -20deg on Z */}
      <mesh ref={coronaBRef} rotation={[0, 0, -20 * Math.PI / 180]}>
        <torusGeometry args={[radius * 1.5, 0.02, 16, 100]} />
        <meshBasicMaterial
          color={star.colorHex}
          transparent
          opacity={0.08}
        />
      </mesh>
    </group>
  );
}

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { auToScene } from "../utils/scaleAU";

interface HabitableZoneProps {
  innerAU: number;
  outerAU: number;
  visible: boolean;
}

export function HabitableZone({ innerAU, outerAU, visible }: HabitableZoneProps) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const innerRadius = auToScene(innerAU);
  const outerRadius = auToScene(outerAU);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    // Oscillate opacity between 0.06 and 0.14 on a 4-second sine cycle
    const t = clock.getElapsedTime();
    matRef.current.opacity = 0.10 + 0.04 * Math.sin((2 * Math.PI * t) / 4);
  });

  if (!visible) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <meshBasicMaterial
        ref={matRef}
        color="#2ECC71"
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

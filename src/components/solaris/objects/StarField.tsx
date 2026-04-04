import { useMemo } from "react";
import * as THREE from "three";

export function StarField() {
  const { positions, colors, sizes } = useMemo(() => {
    const count = 3000;
    const radius = 2000;

    const posArr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    const sizeArr = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random point on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      posArr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      posArr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArr[i * 3 + 2] = radius * Math.cos(phi);

      // Random brightness 0.05 - 0.40 with warm/cool variance
      const brightness = 0.05 + Math.random() * 0.35;
      const warmCool = Math.random(); // 0 = cool blue, 1 = warm yellow
      const r = brightness * (0.9 + warmCool * 0.1);
      const g = brightness * (0.9 + warmCool * 0.05);
      const b = brightness * (1.0 - warmCool * 0.1);

      colArr[i * 3] = r;
      colArr[i * 3 + 1] = g;
      colArr[i * 3 + 2] = b;

      // Random size 0.5 - 1.8
      sizeArr[i] = 0.5 + Math.random() * 1.3;
    }

    return {
      positions: posArr,
      colors: colArr,
      sizes: sizeArr,
    };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={colors.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={sizes.length}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        vertexColors
        sizeAttenuation={false}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </points>
  );
}

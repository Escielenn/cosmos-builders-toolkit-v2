import { useState, useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export interface SimulationTimeState {
  isPlaying: boolean;
  timeYears: number;
  speedMultiplier: number;
}

const MAX_TIME = 10_000;

export function useSimulationTime(initialSpeed: number = 10) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(initialSpeed);
  const timeRef = useRef(0);
  const [timeYears, setTimeYears] = useState(0);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    timeRef.current += delta * speedMultiplier;
    if (timeRef.current > MAX_TIME) timeRef.current -= MAX_TIME;
    setTimeYears(timeRef.current);
  });

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  const reset = useCallback(() => {
    timeRef.current = 0;
    setTimeYears(0);
  }, []);

  return {
    isPlaying,
    timeYears,
    speedMultiplier,
    setSpeedMultiplier,
    togglePlay,
    reset,
    setIsPlaying,
  };
}

const AU_TO_SCENE = 8;

export function auToScene(au: number): number {
  return au * AU_TO_SCENE;
}

export function radiusToScene(radiusEarth: number): number {
  return Math.max(0.15, radiusEarth * 0.5);
}

export function starRadiusToScene(radiusSOL: number): number {
  return Math.max(1.2, radiusSOL * 1.8);
}

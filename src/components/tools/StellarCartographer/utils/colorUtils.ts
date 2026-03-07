// Color Manipulation Utilities
// HSL conversion and color shifting for star variation

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): HSL {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Shift the hue of a hex color by degrees
 */
export function shiftHue(hex: string, degrees: number): string {
  const hsl = hexToHSL(hex);
  hsl.h = (hsl.h + degrees + 360) % 360;
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Convert hex color to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten a hex color by percentage
 */
export function lighten(hex: string, percent: number): string {
  const hsl = hexToHSL(hex);
  hsl.l = Math.min(100, hsl.l + percent);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Darken a hex color by percentage
 */
export function darken(hex: string, percent: number): string {
  const hsl = hexToHSL(hex);
  hsl.l = Math.max(0, hsl.l - percent);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Adjust saturation of a hex color
 */
export function adjustSaturation(hex: string, percent: number): string {
  const hsl = hexToHSL(hex);
  hsl.s = Math.max(0, Math.min(100, hsl.s + percent));
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

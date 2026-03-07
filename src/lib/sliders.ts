// Shared logarithmic slider utilities
// Converts between linear slider position (0–steps) and logarithmic real values

/**
 * Convert a real value to a linear slider position (0–steps).
 * Inverse of sliderToLog.
 */
export function logToSlider(value: number, min: number, max: number, steps = 1000): number {
  if (value <= min) return 0;
  if (value >= max) return steps;
  return Math.round(steps * Math.log(value / min) / Math.log(max / min));
}

/**
 * Convert a linear slider position (0–steps) to a logarithmic real value.
 * Inverse of logToSlider.
 */
export function sliderToLog(slider: number, min: number, max: number, steps = 1000): number {
  if (slider <= 0) return min;
  if (slider >= steps) return max;
  return min * Math.pow(max / min, slider / steps);
}
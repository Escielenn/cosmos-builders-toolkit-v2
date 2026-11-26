// ---------------------------------------------------------------------------
// Sensory modality categories (Sensorium). A DATA palette: one colour per
// physical channel a sense can use, so senses can be grouped at a glance in
// the tool and in its printed report. Not theme colours.
// ---------------------------------------------------------------------------

export const MODALITY_COLOURS = {
  electromagnetic: "#FFD700",
  mechanical: "#00BFFF",
  chemical: "#32CD32",
  "magnetic-thermal": "#FF6347",
  other: "#9370DB",
} as const;

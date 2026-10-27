// Sensor metadata shared by the sensor-history chart and its toggle control.
// Kept separate from the chart component so React Fast Refresh stays happy
// (a file should export either components or non-components, not both).

export const SENSOR_LABELS: Record<string, string> = {
  s2: "T24 (s2)",
  s3: "T30 (s3)",
  s4: "T50 (s4)",
  s7: "P30 (s7)",
  s8: "Nf (s8)",
  s9: "Nc (s9)",
  s11: "Ps30 (s11)",
  s12: "phi (s12)",
  s13: "NRf (s13)",
  s14: "NRc (s14)",
  s15: "Bypass ratio (s15)",
  s17: "HT Bleed (s17)",
  s20: "W31 (s20)",
  s21: "W32 (s21)",
};

// Default selection: two sensors that show clear degradation trends.
export const DEFAULT_SENSORS = ["s11", "s4"];

export const SENSOR_OPTIONS = Object.keys(SENSOR_LABELS);

export const SENSOR_COLORS: Record<string, string> = {
  s2: "#22d3ee",
  s3: "#34d399",
  s4: "#f59e0b",
  s7: "#fb7185",
  s8: "#a78bfa",
  s9: "#60a5fa",
  s11: "#22d3ee",
  s12: "#f472b6",
  s13: "#4ade80",
  s14: "#fbbf24",
  s15: "#38bdf8",
  s17: "#facc15",
  s20: "#f87171",
  s21: "#c084fc",
};

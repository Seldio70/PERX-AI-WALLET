export const colors = {
  background: "#FAF9FE",
  surface: "#FAF9FE",
  surfaceContainer: "#EEEDF3",
  surfaceContainerHigh: "#E9E7ED",
  panel: "rgba(255,255,255,0.7)",
  panelStrong: "rgba(255,255,255,0.85)",
  glass: "rgba(255,255,255,0.58)",
  glassStrong: "rgba(255,255,255,0.78)",
  glassMist: "rgba(255,255,255,0.34)",
  glassEdge: "rgba(255,255,255,0.86)",
  glassShadow: "rgba(31,38,54,0.16)",
  stroke: "rgba(255,255,255,0.4)",
  strokeSubtle: "rgba(193,198,215,0.45)",
  text: "#1A1B1F",
  muted: "#414755",
  soft: "#717786",
  accent: "#0058BC",
  accentDeep: "#004493",
  primary: "#0058BC",
  primaryContainer: "#0070EB",
  onPrimary: "#FFFFFF",
  onPrimaryContainer: "#FEFCFF",
  secondary: "#006E28",
  secondaryContainer: "#6FFB85",
  onSecondaryContainer: "#00732A",
  tertiary: "#4C4ACA",
  tertiaryContainer: "#6664E4",
  onTertiaryContainer: "#FFFBFF",
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#93000A",
  success: "#006E28",
  warning: "#00531C"
};

export const radius = {
  capsule: 999,
  card: 16,
  cardLg: 24,
  compact: 18
};

export const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
  elevation: 6
};

export const liquidShadow = {
  shadowColor: colors.glassShadow,
  shadowOpacity: 0.18,
  shadowRadius: 28,
  shadowOffset: { width: 0, height: 16 },
  elevation: 8
};

export const cardGradients = [
  ["#0070EB", "#0058BC"],
  ["#6664E4", "#4C4ACA"],
  ["#6FFB85", "#006E28"]
] as const;

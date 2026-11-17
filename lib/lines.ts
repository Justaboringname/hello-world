// The subway line colors the UI uses for route bullets. `fill` is the disc,
// `glyph` the letter on it (black on the light lines, as on real signs).
export const LINES = {
  yellow: { fill: "var(--yellow)", glyph: "#000" }, // N Q R W
  orange: { fill: "var(--orange)", glyph: "#000" }, // B D F M
  red: { fill: "var(--red)", glyph: "#fff" }, // 1 2 3
  green: { fill: "var(--green)", glyph: "#fff" }, // 4 5 6
  purple: { fill: "var(--purple)", glyph: "#fff" }, // 7
  blue: { fill: "var(--blue)", glyph: "#fff" }, // A C E
  gray: { fill: "var(--gray)", glyph: "#000" }, // L
  ink: { fill: "var(--ink)", glyph: "var(--canvas)" },
} as const;

export type LineColor = keyof typeof LINES;

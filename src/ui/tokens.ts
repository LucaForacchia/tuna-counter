/** Spacing/shape constants shared across screens, from docs/design.md "Shape and spacing". */

export const spacing = {
  screenPadding: 24,
} as const;

export const radius = {
  card: 16,
  cardLarge: 18,
  segmentedTrack: 14,
  segmentedOption: 10,
  sheetTop: 28,
} as const;

export const sizes = {
  cardBorderWidth: 1,
  pillButtonHeight: 52,
  sheetHandle: { width: 36, height: 4 },
} as const;

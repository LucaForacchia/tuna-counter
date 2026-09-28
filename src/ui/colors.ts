export interface Colors {
  background: string;
  surface: string;
  ink: string;
  inkMuted: string;
  outline: string;
  outlineSoft: string;
  accent: string;
  accentSoft: string;
  onAccentSoft: string;
  cool: string;
  onCool: string;
  lidOuter: string;
  lidRim: string;
}

/** Straight from docs/design.md's color token table. */
export const lightColors: Colors = {
  background: '#F4EFE6',
  surface: '#FFFFFF',
  ink: '#1B2B38',
  inkMuted: '#5A6670',
  outline: '#E2DACB',
  outlineSoft: '#EFE9DE',
  accent: '#B8452F',
  accentSoft: '#F1D9CF',
  onAccentSoft: '#8E3322',
  cool: '#E6ECF1',
  onCool: '#1F4A6B',
  lidOuter: '#E7DFD1',
  lidRim: '#D9CFBE',
};

/**
 * PROVISIONAL — docs/design.md only specifies the light palette (the mockups
 * are light-only). These dark values are derived, not designed: same roles
 * and roughly the same accent hue, inverted for a dark background. Replace
 * with real dark-mode mockup values as soon as they exist.
 */
export const darkColors: Colors = {
  background: '#15130E',
  surface: '#211E16',
  ink: '#F3EFE6',
  inkMuted: '#A6ACAF',
  outline: '#3A3527',
  outlineSoft: '#2A2619',
  accent: '#D96A4D',
  accentSoft: '#3C2A22',
  onAccentSoft: '#F0B9A6',
  cool: '#1D2733',
  onCool: '#9FC4E3',
  lidOuter: '#2A2619',
  lidRim: '#3A3527',
};

/** A translucent scrim behind the Adjust sheet — the standard overlay, not a fixed token; same in both themes. */
export const scrimColor = 'rgba(0, 0, 0, 0.4)';

/**
 * Direction C — "Red and white, enterprise polish".
 *
 * Values taken verbatim from the design canvas (`design/OB Tracker -
 * Direction C.dc.html`). Names describe the role rather than the shade, so a
 * later direction can swap the hexes without touching a screen.
 */
export const colors = {
  // Brand
  primary: '#af101a',
  primaryBright: '#c3121f',
  primaryDark: '#8c0d15',
  /** Start/end of the 165deg header gradient. */
  gradientFrom: '#c3121f',
  gradientTo: '#a10f18',
  /** Start button when the form is not yet valid. */
  primaryMuted: '#d7b3b6',

  onPrimary: '#ffffff',

  // Surfaces
  surface: '#f7f6f7',
  card: '#ffffff',
  cardBorder: '#ecedf0',
  divider: '#eef0f3',
  rowDivider: '#f2f3f5',

  // Inputs
  inputBg: '#fafafb',
  inputBorder: '#e9eaee',
  fieldBg: '#f7f8fa',
  fieldBorder: '#e7e8ec',
  outline: '#e6e8ec',
  outlineStrong: '#dfe2e6',

  // Text
  ink: '#14161a',
  inkSoft: '#3a4048',
  secondary: '#5c636d',
  secondaryAlt: '#6b727b',
  muted: '#9ba1a8',
  mutedCaps: '#8b929b',

  // Red tints
  tintBg: '#fdeef0',
  tintBgSoft: '#fdf4f4',
  tintBorder: '#f0c4c7',

  // Controls
  toggleOff: '#cdd2d8',
  ringTrack: '#ece7e8',
  dashedBorder: '#cdd2d8',

  error: '#af101a',

  /** Translucent whites used on top of the red header. */
  onHeaderChip: 'rgba(255,255,255,0.14)',
  onHeaderChipBorder: 'rgba(255,255,255,0.24)',
  onHeaderPill: 'rgba(255,255,255,0.12)',
  onHeaderFilterBg: 'rgba(255,255,255,0.08)',
  onHeaderFilterBorder: 'rgba(255,255,255,0.22)',
  onHeaderFilterText: '#c7ccd2',
} as const;

/** Shadow presets, matched to the canvas's box-shadows. */
export const shadows = {
  card: {
    shadowColor: '#14161a',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  header: {
    shadowColor: '#a10f18',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  button: {
    shadowColor: '#af101a',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
} as const;

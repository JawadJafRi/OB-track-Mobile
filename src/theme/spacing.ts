/**
 * Direction C spacing and radii.
 *
 * Fixed pixel values rather than scaled ones: the canvas was drawn at a 390pt
 * width and its rhythm (14/18/20 gaps, 58pt controls) is what makes the layout
 * read as deliberate. Scaling those per-device pulled the card padding and the
 * touch targets out of proportion on the test handset.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  base: 10,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  /** Standard horizontal page padding. */
  page: 20,
  /** Horizontal padding inside the red header. */
  headerPage: 22,
  /** Padding inside a white card. */
  card: 18,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  input: 14,
  button: 16,
  listItem: 18,
  card: 20,
  /** Bottom corners of the red header, top corners of the login sheet. */
  sheet: 28,
  full: 999,
} as const;

export const sizes = {
  /** Primary action button and money fields. */
  control: 58,
  /** Text inputs and the login fields. */
  field: 56,
  /** Minimum tap target. */
  tap: 44,
  /** Elapsed-time ring. */
  ring: 214,
  ringInner: 188,
  ringStroke: 13,
} as const;

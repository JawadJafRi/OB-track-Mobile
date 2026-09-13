import { StyleSheet } from 'react-native';

/**
 * Direction C type scale — Manrope.
 *
 * Android matches a font by file name, not by fontFamily + fontWeight, so every
 * style names its weight explicitly (`Manrope-ExtraBold`) rather than pairing a
 * family with `fontWeight: '800'`. The TTFs live in
 * android/app/src/main/assets/fonts and are bundled at build time.
 */
export const fonts = {
  regular: 'Manrope-Regular',
  medium: 'Manrope-Medium',
  semibold: 'Manrope-SemiBold',
  bold: 'Manrope-Bold',
  extrabold: 'Manrope-ExtraBold',
} as const;

export const typography = StyleSheet.create({
  /** 30/800 — the sign-in headline. */
  display: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    letterSpacing: -0.8,
    lineHeight: 35,
  },
  /** 25/800 — screen titles in the red header. */
  h1: {
    fontFamily: fonts.extrabold,
    fontSize: 25,
    letterSpacing: -0.6,
  },
  /** 22/800 — "Task completed". */
  h2: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  /** 21/800 — profile name, stat tile values. */
  h3: {
    fontFamily: fonts.extrabold,
    fontSize: 21,
    letterSpacing: -0.4,
  },
  /** 17/800 — active task title. */
  cardTitleLg: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  /** 16/800 — section headings next to the red bar. */
  cardTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  /** 40/800 tabular — the elapsed clock. */
  timer: {
    fontFamily: fonts.extrabold,
    fontSize: 40,
    letterSpacing: -1.4,
  },
  /** 24/800 tabular — the "spent" figure. */
  amount: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
  },
  /** 20/800 tabular — money inputs. */
  amountInput: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
  },
  /** 19/800 tabular — active-screen stats. */
  statValue: {
    fontFamily: fonts.extrabold,
    fontSize: 19,
  },
  /** 16/500 — input text and body copy. */
  body: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  /** 16/800 — primary button label. */
  button: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  /** 15/700 — list item titles. */
  itemTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  /** 15/600 — sign-in subtitle, toggle labels. */
  bodyStrong: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  /** 14/600 — secondary actions, field captions. */
  bodySm: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  /** 14/400 — muted supporting copy. */
  bodySmPlain: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  /** 13/400 — list subtitles. */
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  /** 13/700 — filter pills. */
  captionStrong: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  /** 12/700 — field labels above inputs. */
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  /** 12/400 — smallest muted copy. */
  micro: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  /** 12/700 uppercase 1.2px — the date line in the header. */
  overline: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  /** 11/800 uppercase 1.4px — "ELAPSED". */
  labelCaps: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  /** 11/800 uppercase 0.9px — stat captions. */
  statCaps: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  /** 11/700 — tab bar labels. */
  tabLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  /** 10/800 uppercase — status chips on history rows. */
  statusCaps: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

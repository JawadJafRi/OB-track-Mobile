import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, shadows } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  /** Extra bottom padding; the design varies this per screen (20-26pt). */
  paddingBottom?: number;
};

/**
 * The red gradient banner that tops Home, History, Profile and Active.
 *
 * Drawn with react-native-svg rather than a gradient library — svg is already a
 * dependency and already linked, so this costs no extra native module. The
 * status-bar inset is absorbed here so each screen's content starts below it
 * without every screen repeating the calculation.
 */
const GradientHeader: React.FC<Props> = ({
  children,
  style,
  paddingBottom = 26,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.sm, paddingBottom },
        style,
      ]}
    >
      {/*
        A 1x1 viewBox with preserveAspectRatio="none" stretches to whatever size
        absoluteFill gives the element. Percentage width/height on the Svg itself
        resolves against an undefined viewport on Android and leaves a gap down
        one edge, so the unit box is the reliable way to fill an arbitrary area.
      */}
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="hdr" x1="0" y1="0" x2="0.26" y2="1">
            <Stop offset="0" stopColor={colors.gradientFrom} />
            <Stop offset="1" stopColor={colors.gradientTo} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill="url(#hdr)" />
      </Svg>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
    paddingHorizontal: spacing.headerPage,
    overflow: 'hidden',
    ...shadows.header,
  },
});

export default GradientHeader;

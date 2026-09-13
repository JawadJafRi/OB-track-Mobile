import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { colors, shadows } from '../../theme/colors';
import { radius, sizes, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

/**
 * The repeating pieces of Direction C. The canvas reuses the same card, the
 * same red-bar section heading and the same pill toggle on nearly every screen;
 * defining them once keeps the screens readable and the styling consistent.
 */

/** White card: 20pt radius, hairline border, layered soft shadow. */
export const Card: React.FC<{ children: ReactNode; style?: ViewStyle }> = ({
  children,
  style,
}) => <View style={[styles.card, style]}>{children}</View>;

/** Section heading preceded by the small red accent bar. */
export const SectionTitle: React.FC<{
  title: string;
  trailing?: ReactNode;
}> = ({ title, trailing }) => (
  <View style={styles.sectionRow}>
    <View style={styles.sectionLeft}>
      <View style={styles.accentBar} />
      <Text style={styles.sectionText}>{title}</Text>
    </View>
    {trailing}
  </View>
);

/** Pill switch used for "Keep me signed in" and "For a Top 10 employee". */
export const Toggle: React.FC<{
  value: boolean;
  onToggle: () => void;
  width?: number;
}> = ({ value, onToggle, width = 48 }) => {
  const knob = width === 48 ? 22 : 20;
  const travel = width - knob - 6;

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[
        styles.track,
        {
          width,
          height: knob + 6,
          borderRadius: radius.full,
          backgroundColor: value ? colors.primary : colors.toggleOff,
        },
      ]}
    >
      <View
        style={[
          styles.knob,
          {
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            transform: [{ translateX: value ? travel : 0 }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

/** Full-width 58pt action button. */
export const ActionButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ImageSourcePropType;
}> = ({ label, onPress, disabled = false, loading = false, icon }) => {
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      style={[
        styles.action,
        inactive
          ? { backgroundColor: colors.primaryMuted, ...shadows.none }
          : { backgroundColor: colors.primary, ...shadows.button },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <>
          {icon ? (
            <Image source={icon} style={styles.actionIcon} resizeMode="contain" />
          ) : null}
          <Text style={styles.actionLabel}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

/** Quiet secondary action sitting under the primary button. */
export const GhostButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'muted' | 'danger';
}> = ({ label, onPress, disabled, tone = 'muted' }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
    style={styles.ghost}
  >
    <Text
      style={[
        styles.ghostLabel,
        { color: tone === 'danger' ? colors.primary : colors.secondaryAlt },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/** White circle with red initials, as used in the headers. */
export const InitialsAvatar: React.FC<{
  name: string | null | undefined;
  size?: number;
  fontSize?: number;
}> = ({ name, size = 38, fontSize = 13 }) => (
  <View
    style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2 },
    ]}
  >
    <Text style={[styles.avatarText, { fontSize }]}>{initialsOf(name)}</Text>
  </View>
);

export function initialsOf(name: string | null | undefined): string {
  if (!name) {
    return '··';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '··';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** One of the three lifetime figures on the profile screen. */
export const StatTile: React.FC<{ value: string; label: string }> = ({
  value,
  label,
}) => (
  <View style={styles.statTile}>
    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/** A PNG icon tinted to an arbitrary colour — the canvas does this with CSS masks. */
export const Icon: React.FC<{
  source: ImageSourcePropType;
  size?: number;
  color?: string;
  style?: ImageStyle;
}> = ({ source, size = 19, color = colors.muted, style }) => (
  <Image
    source={source}
    resizeMode="contain"
    style={[{ width: size, height: size, tintColor: color }, style]}
  />
);

/** Label above an input. */
export const FieldLabel: React.FC<{
  children: ReactNode;
  style?: TextStyle;
}> = ({ children, style }) => (
  <Text style={[styles.fieldLabel, style]}>{children}</Text>
);

/** The sticky white bar that holds a screen's primary action. */
export const ActionBar: React.FC<{ children: ReactNode }> = ({ children }) => (
  <View style={styles.actionBar}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: spacing.card,
    ...shadows.card,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  accentBar: {
    width: 4,
    height: 17,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionText: { ...typography.cardTitle, color: colors.ink },
  track: { justifyContent: 'center', paddingHorizontal: 3 },
  knob: {
    backgroundColor: '#ffffff',
    shadowColor: '#10141a',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  action: {
    height: sizes.control,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  actionIcon: { width: 19, height: 19, tintColor: colors.onPrimary },
  actionLabel: { ...typography.button, color: colors.onPrimary },
  ghost: { height: 46, alignItems: 'center', justifyContent: 'center' },
  ghostLabel: { ...typography.bodySm },
  avatar: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.cardTitle.fontFamily,
    letterSpacing: 0.4,
    color: colors.primary,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.listItem,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: { ...typography.h3, color: colors.ink },
  statLabel: { ...typography.statCaps, color: colors.mutedCaps },
  fieldLabel: { ...typography.fieldLabel, color: colors.secondary },
  actionBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
  },
});

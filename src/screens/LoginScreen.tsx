import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../theme/colors';
import { radius, sizes, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { ActionButton, FieldLabel, Icon, Toggle } from '../components/ui';

const dplLogo = require('../assets/images/dpl-logo.png');
const mailIcon = require('../assets/icons/mail.png');
const lockIcon = require('../assets/icons/lock.png');
const eyeIcon = require('../assets/icons/eye.png');
const eyeOffIcon = require('../assets/icons/eye-off.png');

/**
 * Direction C sign-in: a full-bleed red field carrying the logo and headline,
 * with the form riding up over it on a rounded white sheet.
 */
const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err) {
      // A failed request is not the same as a wrong password — reporting a
      // network outage as "invalid credentials" sends people off changing a
      // password that was never the problem.
      if (err instanceof ApiError) {
        setError(
          err.statusCode === 401 ? 'Invalid email or password.' : err.message,
        );
      } else {
        setError('Cannot reach the server. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientFrom} />

      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="login" x1="0" y1="0" x2="0.26" y2="1">
            <Stop offset="0" stopColor={colors.gradientFrom} />
            <Stop offset="1" stopColor={colors.gradientTo} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill="url(#login)" />
      </Svg>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
            <View style={styles.logoChip}>
              <Image source={dplLogo} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to start tracking your tasks.
              </Text>
            </View>
          </View>

          <View
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xxl }]}
          >
            <View style={styles.field}>
              <FieldLabel>Email</FieldLabel>
              <View style={styles.inputRow}>
                <Icon source={mailIcon} size={20} color={colors.muted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@dpl.com"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <FieldLabel>Password</FieldLabel>
              <View style={[styles.inputRow, styles.inputRowTrailing]}>
                <Icon source={lockIcon} size={20} color={colors.muted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={styles.eyeButton}
                  accessibilityLabel={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  <Icon
                    source={showPassword ? eyeOffIcon : eyeIcon}
                    size={20}
                    color={colors.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rememberRow}>
              <TouchableOpacity
                style={styles.rememberLeft}
                activeOpacity={0.8}
                onPress={() => setRemember(v => !v)}
              >
                <Toggle
                  value={remember}
                  onToggle={() => setRemember(v => !v)}
                  width={44}
                />
                <Text style={styles.rememberLabel}>Keep me signed in</Text>
              </TouchableOpacity>
              <Text style={styles.help}>Need help?</Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <ActionButton
              label={loading ? 'Signing in' : 'Sign in'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            />

            <Text style={styles.footer}>
              For login issues, contact the Admin Department
            </Text>
            <Text style={styles.version}>App Version 1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gradientTo },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    paddingHorizontal: 26,
    paddingBottom: 30,
    gap: spacing.lg,
  },
  logoChip: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#ffffff',
  },
  logo: { width: 96, height: 34 },
  heroText: { gap: spacing.sm },
  title: { ...typography.display, color: '#ffffff' },
  subtitle: { ...typography.bodyStrong, color: '#ffffff' },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xxxl,
    paddingTop: 26,
    gap: spacing.xl,
  },
  field: { gap: spacing.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: sizes.field,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.outlineStrong,
    borderRadius: radius.input,
  },
  inputRowTrailing: { paddingRight: 6 },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
    padding: 0,
  },
  eyeButton: {
    width: sizes.tap,
    height: sizes.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    minHeight: sizes.tap,
  },
  rememberLabel: { ...typography.bodySm, color: colors.inkSoft },
  help: { ...typography.captionStrong, color: colors.primary },
  error: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  footer: {
    ...typography.micro,
    color: colors.secondaryAlt,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  version: {
    ...typography.micro,
    color: colors.muted,
    textAlign: 'center',
  },
});

export default LoginScreen;

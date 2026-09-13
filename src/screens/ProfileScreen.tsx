import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useDialog } from '../components/ui/DialogProvider';

import GradientHeader from '../components/ui/GradientHeader';
import { InitialsAvatar, StatTile } from '../components/ui';
import { colors } from '../theme/colors';
import { radius, sizes, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { getStats } from '../api/tasks';
import type { TaskStats } from '../api/types';
import { formatAmount, formatDuration } from '../utils/format';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const dialog = useDialog();

  const [stats, setStats] = useState<TaskStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await getStats());
    } catch {
      // The profile is still useful without the lifetime numbers.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmLogout = async () => {
    const ok = await dialog.confirm({
      title: 'Log out?',
      message: 'You will need to sign in again.',
      confirmLabel: 'Log out',
      cancelLabel: 'Stay signed in',
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // logout() clears local tokens even if the server call fails.
    } finally {
      setLoggingOut(false);
    }
  };

  const accountRows = [
    { label: 'Email', value: user?.email ?? '—' },
    { label: 'Phone', value: user?.phone || '—' },
    {
      label: 'Role',
      value: user?.role === 'OFFICE_BOY' ? 'Office Boy' : 'Admin',
    },
    { label: 'Reports to', value: 'Admin Department' },
  ];

  const pettyRows = stats
    ? [
        { label: 'Received', value: `PKR ${formatAmount(stats.totalAmountReceived)}` },
        { label: 'Returned', value: `PKR ${formatAmount(stats.totalAmountReturned)}` },
        { label: 'Net', value: `PKR ${formatAmount(stats.netAmount)}` },
        {
          label: 'Reimbursement',
          value: `PKR ${formatAmount(stats.reimbursementAmount)}`,
        },
      ]
    : [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientFrom} />

      <GradientHeader paddingBottom={24} style={styles.header}>
        <View style={styles.headerRow}>
          <InitialsAvatar name={user?.name} size={58} fontSize={19} />
          <View style={styles.headerText}>
            <Text style={styles.name}>{user?.name ?? 'Office Boy'}</Text>
            <Text style={styles.role}>
              {user?.role === 'OFFICE_BOY' ? 'Office Boy' : 'Admin'} · Head Office
            </Text>
          </View>
        </View>
      </GradientHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statRow}>
          <StatTile
            value={String(stats?.tasks.COMPLETED ?? 0)}
            label="Tasks"
          />
          <StatTile
            value={((stats?.totalDistanceMeters ?? 0) / 1000).toFixed(1)}
            label="Km"
          />
          <StatTile
            value={formatDuration(stats?.totalDurationSeconds)}
            label="On task"
          />
        </View>

        <View style={styles.rowCard}>
          {accountRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.row,
                index === accountRows.length - 1 && styles.rowLast,
              ]}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {pettyRows.length > 0 ? (
          <View style={styles.rowCard}>
            {pettyRows.map((row, index) => (
              <View
                key={row.label}
                style={[
                  styles.row,
                  index === pettyRows.length - 1 && styles.rowLast,
                ]}
              >
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.logout}
          onPress={confirmLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerText: { flex: 1, gap: 3 },
  name: { ...typography.h3, color: '#ffffff' },
  role: { ...typography.caption, color: '#ffffff' },
  scroll: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  statRow: { flexDirection: 'row', gap: spacing.base },
  rowCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.rowDivider,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { ...typography.bodySmPlain, color: colors.secondaryAlt },
  rowValue: {
    ...typography.itemTitle,
    color: colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  logout: {
    height: sizes.field,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.tintBorder,
    backgroundColor: colors.tintBgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { ...typography.itemTitle, fontSize: 16, color: colors.primary },
  version: { ...typography.micro, color: colors.muted, textAlign: 'center' },
});

export default ProfileScreen;

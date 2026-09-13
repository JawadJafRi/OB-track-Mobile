import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDialog } from '../components/ui/DialogProvider';
import {
  ActionBar,
  ActionButton,
  Card,
  GhostButton,
  Icon,
  SectionTitle,
} from '../components/ui';
import { colors } from '../theme/colors';
import { radius, sizes, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { getTask, submitTask, updateSettlement } from '../api/tasks';
import type { Task } from '../api/types';
import { formatAmount, formatDistance, formatDuration } from '../utils/format';

const checkIcon = require('../assets/icons/check.png');

type Nav = NativeStackNavigationProp<RootStackParamList, 'TaskCompleted'>;
type Route = RouteProp<RootStackParamList, 'TaskCompleted'>;

/**
 * Wrap-up. Everything shown is read back from the server — distance and
 * duration are computed there when the task ends, so the previous screen could
 * not supply them even if it wanted to.
 */
const TaskCompletedScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [received, setReceived] = useState('');
  const [returned, setReturned] = useState('');
  const [vendor, setVendor] = useState('');

  useEffect(() => {
    let cancelled = false;
    getTask(params.taskId)
      .then(result => {
        if (cancelled) {
          return;
        }
        setTask(result);
        setReceived(result.amountReceived ? String(result.amountReceived) : '');
        setReturned(result.amountReturned ? String(result.amountReturned) : '');
        setVendor(result.vendorDetails ?? '');
      })
      .catch(error => {
        dialog
          .notify({
            title: 'Could not load the task',
            message:
              error instanceof Error ? error.message : 'Please try again.',
            dismissLabel: 'Back',
          })
          .then(() => navigation.navigate('Main'));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.taskId, navigation, dialog]);

  const toNumber = (raw: string): number => {
    const n = Number(raw.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const rec = toNumber(received);
  const ret = toNumber(returned);
  const over = ret > rec;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Settlement first: submitting locks the task, so amounts must land before it.
      await updateSettlement(params.taskId, {
        amountReceived: rec,
        amountReturned: ret,
        vendorDetails: vendor.trim() || undefined,
      });
      await submitTask(params.taskId);

      await dialog.notify({
        title: 'Submitted',
        message: 'This task has been sent to the admin.',
        dismissLabel: 'Done',
      });
      navigation.navigate('Main');
    } catch (error) {
      dialog.notify({
        title: 'Could not submit',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !task) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const submitted = Boolean(task.submittedAt);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.checkBadge}>
            <Icon source={checkIcon} size={26} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Task completed</Text>
          <Text style={styles.heroSubtitle}>
            {task.title || task.description}
          </Text>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatDuration(task.durationSeconds)}
            </Text>
            <Text style={styles.summaryCaps}>Duration</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatDistance(task.distanceMeters)}
            </Text>
            <Text style={styles.summaryCaps}>Distance</Text>
          </View>
        </Card>

        {submitted ? (
          <Card style={styles.gap14}>
            <SectionTitle title="Petty cash" />
            <View style={styles.lockedRow}>
              <Text style={styles.lockedLabel}>You took</Text>
              <Text style={styles.lockedValue}>
                PKR {formatAmount(task.amountReceived)}
              </Text>
            </View>
            <View style={styles.lockedRow}>
              <Text style={styles.lockedLabel}>You brought back</Text>
              <Text style={styles.lockedValue}>
                PKR {formatAmount(task.amountReturned)}
              </Text>
            </View>
            {task.vendorDetails ? (
              <Text style={styles.vendorNote}>{task.vendorDetails}</Text>
            ) : null}
            <Text style={styles.submittedNote}>
              Already submitted — settlement is locked.
            </Text>
          </Card>
        ) : (
          <Card style={styles.gap14}>
            <SectionTitle
              title="Petty cash"
              trailing={<Text style={styles.skipHint}>Skip if none</Text>}
            />

            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>You took</Text>
              <Text style={styles.currency}>PKR</Text>
              <TextInput
                value={received}
                onChangeText={setReceived}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={styles.moneyInput}
              />
            </View>

            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>You brought back</Text>
              <Text style={styles.currency}>PKR</Text>
              <TextInput
                value={returned}
                onChangeText={setReturned}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={styles.moneyInput}
              />
            </View>

            <View
              style={[
                styles.spentPanel,
                {
                  backgroundColor: over ? colors.tintBgSoft : colors.fieldBg,
                  borderColor: over ? colors.tintBorder : colors.outline,
                },
              ]}
            >
              <View style={styles.spentLabels}>
                <Text
                  style={[
                    styles.spentLabel,
                    { color: over ? colors.primary : colors.ink },
                  ]}
                >
                  {over ? 'Owed back to you' : 'Spent on this task'}
                </Text>
                <Text style={styles.spentHint}>
                  {over
                    ? 'You returned more than you took'
                    : 'Took minus brought back'}
                </Text>
              </View>
              <Text
                style={[
                  styles.spentValue,
                  { color: over ? colors.primary : colors.ink },
                ]}
              >
                {formatAmount(rec - ret)}
              </Text>
            </View>

            <View style={styles.vendorField}>
              <Text style={styles.moneyLabel}>Vendor / invoice</Text>
              <TextInput
                value={vendor}
                onChangeText={setVendor}
                placeholder="Shop name, branch, invoice number…"
                placeholderTextColor={colors.muted}
                style={styles.vendorInput}
                multiline
              />
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom > 0 ? 0 : spacing.xs }}>
        <ActionBar>
          {submitted ? (
            <ActionButton
              label="Back to home"
              onPress={() => navigation.navigate('Main')}
            />
          ) : (
            <>
              <ActionButton
                label={saving ? 'Submitting' : 'Submit to admin'}
                onPress={handleSubmit}
                loading={saving}
                disabled={saving}
              />
              <GhostButton
                label="Finish this later"
                onPress={() => navigation.navigate('Main')}
                disabled={saving}
              />
            </>
          )}
        </ActionBar>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  hero: { alignItems: 'center', gap: spacing.base, paddingVertical: spacing.sm },
  checkBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.tintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.h2, color: colors.ink },
  heroSubtitle: {
    ...typography.bodySmPlain,
    color: colors.secondaryAlt,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    paddingVertical: spacing.card,
    paddingHorizontal: spacing.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  summaryDivider: { width: 1, backgroundColor: colors.divider },
  summaryValue: { ...typography.h2, color: colors.ink },
  summaryCaps: { ...typography.statCaps, color: colors.mutedCaps },
  gap14: { gap: spacing.lg },
  skipHint: { ...typography.micro, color: colors.muted },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: sizes.control,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.fieldBg,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radius.input,
  },
  moneyLabel: { flex: 1, ...typography.bodySm, color: colors.inkSoft },
  currency: { ...typography.fieldLabel, color: colors.muted },
  moneyInput: {
    width: 110,
    ...typography.amountInput,
    color: colors.ink,
    textAlign: 'right',
    padding: 0,
  },
  spentPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.input,
    borderWidth: 1.5,
  },
  spentLabels: { flex: 1, gap: 2 },
  spentLabel: { ...typography.bodySm, fontFamily: typography.cardTitle.fontFamily },
  spentHint: { ...typography.micro, color: colors.secondaryAlt },
  spentValue: { ...typography.amount },
  vendorField: { gap: spacing.sm },
  vendorInput: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.fieldBg,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedLabel: { ...typography.bodySm, color: colors.secondaryAlt },
  lockedValue: { ...typography.itemTitle, color: colors.ink },
  vendorNote: { ...typography.caption, color: colors.secondaryAlt },
  submittedNote: { ...typography.micro, color: colors.muted },
});

export default TaskCompletedScreen;

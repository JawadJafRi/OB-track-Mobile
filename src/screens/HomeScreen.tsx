import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import GradientHeader from '../components/ui/GradientHeader';
import { useDialog } from '../components/ui/DialogProvider';
import {
  ActionBar,
  ActionButton,
  Card,
  FieldLabel,
  Icon,
  InitialsAvatar,
  SectionTitle,
  Toggle,
  initialsOf,
} from '../components/ui';
import { colors } from '../theme/colors';
import { radius, sizes, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import {
  createTask,
  listEmployees,
  listTasks,
  startTask,
} from '../api/tasks';
import type { Employee, Task } from '../api/types';
import { ApiError } from '../api/client';
import { getCurrentFix, requestLocationPermission } from '../services/location';
import { uuidv4 } from '../utils/uuid';
import { firstName, formatElapsed, greetingFor, secondsSince, todayLabel } from '../utils/format';

const dplLogo = require('../assets/images/dpl-logo.png');
const micIcon = require('../assets/icons/mic.png');
const infoIcon = require('../assets/icons/info.png');
const walkIcon = require('../assets/icons/walk.png');
const taskAltIcon = require('../assets/icons/task-alt.png');

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

/** Rotating chip colours for the employee list, as in the canvas. */
const CHIP_COLORS = [colors.primary, colors.primaryBright, colors.primaryDark];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const dialog = useDialog();

  const [taskText, setTaskText] = useState('');
  const [destination, setDestination] = useState('');
  const [isTop, setIsTop] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [running, setRunning] = useState<Task | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const inProgress = await listTasks({ status: 'IN_PROGRESS', limit: 1 });
      const active = inProgress.items[0] ?? null;
      setRunning(active);
      setElapsed(secondsSince(active?.startedAt));
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : 'Could not reach the server. Pull down to retry.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Keeps the "in progress" banner's clock live while Home is on screen.
  useFocusEffect(
    useCallback(() => {
      if (!running?.startedAt) {
        return;
      }
      const id = setInterval(
        () => setElapsed(secondsSince(running.startedAt)),
        1000,
      );
      return () => clearInterval(id);
    }, [running?.startedAt]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onToggleTop = async () => {
    const next = !isTop;
    setIsTop(next);

    if (!next) {
      setSelected(null);
      return;
    }

    if (employees.length === 0) {
      try {
        setEmployees((await listEmployees()).items);
      } catch {
        dialog.notify({
          title: 'Could not load employees',
          message: 'Please check your connection and try again.',
        });
        setIsTop(false);
      }
    }
  };

  const ready = taskText.trim().length > 0;

  const handleStart = async () => {
    if (!ready) {
      return;
    }

    if (isTop && !selected) {
      dialog.notify({
        title: 'Choose an employee',
        message: 'Pick who this task is for.',
      });
      return;
    }

    if (running) {
      navigation.navigate('ActiveTask', { taskId: running.id });
      return;
    }

    setStarting(true);
    try {
      const allowed = await requestLocationPermission();
      if (!allowed) {
        dialog.notify({
          title: 'Location needed',
          message:
            'A task records where it starts and ends, so location access is required to begin.',
        });
        return;
      }

      // Fix first, then create: a failed GPS read leaves no orphan PENDING task.
      const fix = await getCurrentFix();

      const created = await createTask({
        clientTaskId: uuidv4(),
        description: taskText.trim(),
        destination: destination.trim() || undefined,
        employeeId: selected?.id,
      });
      await startTask(created.id, fix);

      setTaskText('');
      setDestination('');
      setIsTop(false);
      setSelected(null);

      navigation.navigate('ActiveTask', { taskId: created.id });
    } catch (error) {
      dialog.notify({
        title: 'Could not start the task',
        message:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setStarting(false);
    }
  };

  const topSummary = isTop
    ? selected
      ? `${selected.name}${selected.department ? ' · ' + selected.department : ''}`
      : 'Choose the employee'
    : 'Off — normal task';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientFrom} />

      <GradientHeader>
        <View style={styles.headerTop}>
          <View style={styles.logoChip}>
            <Image source={dplLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('Profile')}
            activeOpacity={0.8}
          >
            <InitialsAvatar name={user?.name} />
          </TouchableOpacity>
        </View>
        <View style={styles.greetingBlock}>
          <Text style={styles.today}>{todayLabel()}</Text>
          <Text style={styles.greeting}>
            {greetingFor()}, {firstName(user?.name)}
          </Text>
        </View>
      </GradientHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : null}

        {running ? (
          <TouchableOpacity
            style={styles.runningCard}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate('ActiveTask', { taskId: running.id })
            }
          >
            <View style={styles.runningDot} />
            <View style={styles.runningText}>
              <Text style={styles.runningCaps}>
                In progress · {formatElapsed(elapsed)}
              </Text>
              <Text style={styles.runningTitle} numberOfLines={1}>
                {running.title || running.description}
              </Text>
            </View>
            <Text style={styles.runningOpen}>Open</Text>
          </TouchableOpacity>
        ) : null}

        <Card style={styles.formCard}>
          <View style={styles.cardHead}>
            <SectionTitle title="New task" />
          </View>

          <View style={styles.field}>
            <FieldLabel>Task</FieldLabel>
            <View style={styles.textAreaRow}>
              <TextInput
                value={taskText}
                onChangeText={setTaskText}
                placeholder="What are you going to do?"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={2}
                style={styles.textArea}
              />
              <TouchableOpacity
                style={styles.micButton}
                activeOpacity={0.75}
                onPress={() =>
                  dialog.notify({
                    title: 'Voice input',
                    message:
                      'Speech-to-text is not part of this build yet. Please type the task for now.',
                  })
                }
              >
                <Icon source={micIcon} size={19} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <FieldLabel>
              Destination <Text style={styles.optional}>· optional</Text>
            </FieldLabel>
            <View style={styles.inputRow}>
              <Icon source={walkIcon} size={19} color={colors.muted} />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Where are you going?"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.topSection}>
            <TouchableOpacity
              style={styles.topRow}
              activeOpacity={0.8}
              onPress={onToggleTop}
            >
              <View style={styles.topLabels}>
                <Text style={styles.topTitle}>For a Top 10 employee</Text>
                <Text style={styles.topSummary}>{topSummary}</Text>
              </View>
              <Toggle value={isTop} onToggle={onToggleTop} />
            </TouchableOpacity>

            {isTop ? (
              <View style={styles.employeeList}>
                {employees.length === 0 ? (
                  <Text style={styles.topSummary}>No active employees found.</Text>
                ) : (
                  employees.map((employee, index) => {
                    const on = selected?.id === employee.id;
                    return (
                      <TouchableOpacity
                        key={employee.id}
                        activeOpacity={0.8}
                        onPress={() => setSelected(employee)}
                        style={[
                          styles.employeeRow,
                          {
                            borderColor: on ? colors.primary : colors.outline,
                            backgroundColor: on ? colors.tintBgSoft : colors.card,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.employeeChip,
                            {
                              backgroundColor:
                                CHIP_COLORS[index % CHIP_COLORS.length],
                            },
                          ]}
                        >
                          <Text style={styles.employeeChipText}>
                            {initialsOf(employee.name)}
                          </Text>
                        </View>
                        <View style={styles.employeeLabels}>
                          <Text style={styles.employeeName}>{employee.name}</Text>
                          {employee.department ? (
                            <Text style={styles.employeeDept}>
                              {employee.department}
                            </Text>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.radio,
                            {
                              borderColor: on ? colors.primary : colors.outline,
                              backgroundColor: on
                                ? colors.primary
                                : 'transparent',
                            },
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : null}
          </View>
        </Card>

        <View style={styles.hintRow}>
          <Icon source={infoIcon} size={14} color={colors.muted} />
          <Text style={styles.hintText}>
            Route and time are recorded until you end the task.
          </Text>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom > 0 ? 0 : spacing.xs }}>
        <ActionBar>
          <ActionButton
            label={starting ? 'Starting' : 'Start task'}
            onPress={handleStart}
            disabled={!ready || starting}
            loading={starting}
            icon={taskAltIcon}
          />
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    backgroundColor: '#ffffff',
  },
  logo: { width: 72, height: 26 },
  greetingBlock: { marginTop: spacing.xl, gap: spacing.xs },
  today: { ...typography.overline, color: '#ffffff' },
  greeting: { ...typography.h1, color: '#ffffff' },
  scroll: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.tintBgSoft,
    borderWidth: 1,
    borderColor: colors.tintBorder,
    borderRadius: radius.input,
    padding: spacing.lg,
  },
  errorText: { ...typography.caption, color: colors.primary },
  runningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  runningDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  runningText: { flex: 1, gap: 3 },
  runningCaps: { ...typography.statusCaps, fontSize: 11, color: '#ffffff' },
  runningTitle: { ...typography.itemTitle, color: '#ffffff' },
  runningOpen: { ...typography.statusCaps, fontSize: 12, color: '#ffffff' },
  formCard: { gap: spacing.xl },
  cardHead: {
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  field: { gap: spacing.sm },
  optional: { fontFamily: typography.body.fontFamily, color: colors.muted },
  textAreaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.input,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
  },
  textArea: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
    minHeight: 52,
    padding: 0,
    textAlignVertical: 'top',
  },
  micButton: {
    width: sizes.tap,
    height: sizes.tap,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: sizes.field,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.input,
  },
  input: { flex: 1, ...typography.body, color: colors.ink, padding: 0 },
  topSection: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  topLabels: { flex: 1, gap: 2 },
  topTitle: { ...typography.itemTitle, color: colors.ink },
  topSummary: { ...typography.caption, color: colors.secondaryAlt },
  employeeList: { gap: spacing.sm },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 58,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderRadius: radius.input,
  },
  employeeChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeChipText: {
    fontFamily: typography.cardTitle.fontFamily,
    fontSize: 13,
    color: '#ffffff',
  },
  employeeLabels: { flex: 1, gap: 1 },
  employeeName: { ...typography.itemTitle, color: colors.ink },
  employeeDept: { ...typography.caption, color: colors.secondaryAlt },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  hintText: { ...typography.micro, color: colors.secondaryAlt },
});

export default HomeScreen;

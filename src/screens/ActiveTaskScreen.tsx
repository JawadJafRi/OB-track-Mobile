import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';

import GradientHeader from '../components/ui/GradientHeader';
import { useDialog } from '../components/ui/DialogProvider';
import { ActionBar, ActionButton, Card, GhostButton, Icon } from '../components/ui';
import { colors } from '../theme/colors';
import { radius, sizes, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { addLocations, cancelTask, endTask, getTask } from '../api/tasks';
import type { LocationBatchItem, Task } from '../api/types';
import {
  getCurrentFix,
  haversineMeters,
  watchPosition,
} from '../services/location';
import { startTracking, stopTracking } from '../services/taskTracking';
import {
  formatClock,
  formatDistance,
  formatElapsed,
  secondsSince,
} from '../utils/format';

const walkIcon = require('../assets/icons/walk.png');

type Nav = NativeStackNavigationProp<RootStackParamList, 'ActiveTask'>;
type Route = RouteProp<RootStackParamList, 'ActiveTask'>;

const FLUSH_INTERVAL_MS = 30000;

/** Ring geometry, matching the canvas's 214pt outer / 188pt inner. */
const RING = sizes.ring;
const STROKE = sizes.ringStroke;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ActiveTaskScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [gpsOk, setGpsOk] = useState(false);
  const [pointsSent, setPointsSent] = useState(0);

  /**
   * Distance measured on the device, from the fixes as they arrive.
   *
   * The screen used to render `task.distanceMeters`, which the server only
   * computes when the task ENDS — so it was null for the whole task and the
   * stat read "0 km" however far you walked. The number was never wrong,
   * exactly; it just did not exist yet. Measuring here means the figure moves
   * while you walk, and it keeps moving with no network at all.
   *
   * The server still recomputes the authoritative distance from the uploaded
   * points on end; this is the live read-out, not the record.
   */
  const [liveMeters, setLiveMeters] = useState(0);
  /** Every fix seen this session, uploaded or not — see `trackingNote`. */
  const [pointsSeen, setPointsSeen] = useState(0);
  const lastFix = useRef<{ latitude: number; longitude: number } | null>(null);

  const buffer = useRef<LocationBatchItem[]>([]);
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    if (flushing.current || buffer.current.length === 0) {
      return;
    }
    flushing.current = true;
    const batch = buffer.current;
    buffer.current = [];

    try {
      const result = await addLocations(params.taskId, batch);
      setPointsSent(previous => previous + result.accepted);
    } catch {
      // Put them back — the server upserts on clientId, so a re-send is free.
      buffer.current = [...batch, ...buffer.current];
    } finally {
      flushing.current = false;
    }
  }, [params.taskId]);

  useEffect(() => {
    let cancelled = false;
    getTask(params.taskId)
      .then(result => {
        if (cancelled) {
          return;
        }
        setTask(result);
        setElapsed(secondsSince(result.startedAt));
      })
      .catch(error => {
        dialog
          .notify({
            title: 'Could not load the task',
            message:
              error instanceof Error ? error.message : 'Please try again.',
            dismissLabel: 'Back',
          })
          .then(() => navigation.goBack());
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

  // Derived from the server's startedAt, so backgrounding never drifts it.
  useEffect(() => {
    if (!task?.startedAt || task.status !== 'IN_PROGRESS') {
      return;
    }
    const id = setInterval(() => setElapsed(secondsSince(task.startedAt)), 1000);
    return () => clearInterval(id);
  }, [task?.startedAt, task?.status]);

  useEffect(() => {
    if (task?.status !== 'IN_PROGRESS') {
      return;
    }
    const unsubscribe = watchPosition(
      point => {
        setGpsOk(true);
        buffer.current.push(point);
        setPointsSeen(previous => previous + 1);

        // Add the leg from the previous fix. `watchPosition` already applies a
        // 10 m distanceFilter, so GPS jitter while standing still does not
        // accumulate into a phantom walk.
        const previousFix = lastFix.current;
        if (previousFix) {
          setLiveMeters(
            current => current + haversineMeters(previousFix, point),
          );
        }
        lastFix.current = { latitude: point.latitude, longitude: point.longitude };
      },
      () => setGpsOk(false),
    );
    const timer = setInterval(flush, FLUSH_INTERVAL_MS);

    // Paired with the GPS subscription rather than the end/cancel handlers, so
    // that every way out of a running task — ending it, cancelling it, or the
    // screen being torn down — takes the notification with it. Hooking it to
    // the handlers alone would strand a live notification whenever the task
    // ended by some path nobody thought of.
    startTracking(task?.title ?? task?.description ?? null);

    return () => {
      unsubscribe();
      clearInterval(timer);
      stopTracking();
    };
  }, [task?.status, task?.title, task?.description, flush]);

  const handleEnd = async () => {
    setBusy(true);
    try {
      await flush();
      const fix = await getCurrentFix();
      await endTask(params.taskId, fix);
      navigation.replace('TaskCompleted', { taskId: params.taskId });
    } catch (error) {
      dialog.notify({
        title: 'Could not end the task',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmEnd = async () => {
    const ok = await dialog.confirm({
      title: 'End this task?',
      message: 'Your route and time will be recorded.',
      confirmLabel: 'End task',
      cancelLabel: 'Keep going',
    });
    if (ok) {
      handleEnd();
    }
  };

  const doCancel = async (reason: string) => {
    setBusy(true);
    try {
      let fix;
      try {
        fix = await getCurrentFix(8000);
      } catch {
        // Optional on cancel: things go wrong in the field, often without signal.
        fix = undefined;
      }
      await cancelTask(params.taskId, reason, fix);
      navigation.navigate('Main');
    } catch (error) {
      dialog.notify({
        title: 'Could not cancel',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async () => {
    const ok = await dialog.confirm({
      title: 'Cancel this task',
      message: 'It will be recorded as cancelled, not completed.',
      confirmLabel: 'Cancel task',
      cancelLabel: 'Never mind',
      destructive: true,
    });
    if (ok) {
      doCancel('Cancelled from the mobile app.');
    }
  };

  if (loading || !task) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isRunning = task.status === 'IN_PROGRESS';
  // One full sweep per hour, as the canvas does.
  const progress = ((elapsed % 3600) / 3600) * CIRCUMFERENCE;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientFrom} />

      <GradientHeader paddingBottom={20}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Back"
          >
            <View style={styles.chevron} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task in progress</Text>
          <View style={styles.gpsPill}>
            <View
              style={[
                styles.gpsDot,
                { opacity: gpsOk ? 1 : 0.45 },
              ]}
            />
            <Text style={styles.gpsText}>GPS</Text>
          </View>
        </View>

        <View style={styles.destChip}>
          <Icon source={walkIcon} size={18} color="#ffffff" />
          <Text style={styles.destText} numberOfLines={1}>
            {task.destination || 'No destination set'}
          </Text>
        </View>
      </GradientHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={colors.ringTrack}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${progress} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <View style={styles.ringInner} pointerEvents="none">
            <Text style={styles.clock}>{formatElapsed(elapsed)}</Text>
            <Text style={styles.clockCaps}>Elapsed</Text>
          </View>
        </View>

        <Card style={styles.detailCard}>
          <Text style={styles.taskTitle}>{task.title || task.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDistance(
                  // A finished task has the server's figure; a running one has
                  // only what this device has measured so far.
                  task.status === 'IN_PROGRESS' ? liveMeters : task.distanceMeters,
                )}
              </Text>
              <Text style={styles.statCaps}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={[styles.stat, styles.statRight]}>
              <Text style={styles.statValue}>{formatClock(task.startedAt)}</Text>
              <Text style={styles.statCaps}>Started</Text>
            </View>
          </View>

          <Text style={styles.trackingNote}>
            {gpsOk
              ? `Location tracked · ${pointsSeen} point${
                  pointsSeen === 1 ? '' : 's'
                }${
                  // Distinguish "recorded on this phone" from "safely on the
                  // server". They diverge whenever the network is down, and the
                  // old text claimed the latter while showing the former.
                  pointsSent < pointsSeen
                    ? ` · ${pointsSeen - pointsSent} waiting to upload`
                    : ' recorded'
                }`
              : 'Acquiring GPS signal…'}
          </Text>
        </Card>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom > 0 ? 0 : spacing.xs }}>
        <ActionBar>
          {isRunning ? (
            <>
              <ActionButton
                label={busy ? 'Ending' : 'End task'}
                onPress={confirmEnd}
                loading={busy}
                disabled={busy}
              />
              <GhostButton
                label="Cancel this task"
                onPress={confirmCancel}
                disabled={busy}
              />
            </>
          ) : (
            <ActionButton
              label="Back to home"
              onPress={() => navigation.navigate('Main')}
            />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: sizes.tap,
    height: sizes.tap,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.md,
  },
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
  },
  headerTitle: { ...typography.bodySm, color: '#ffffff', letterSpacing: 0.2 },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.onHeaderPill,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ffffff',
  },
  gpsText: {
    ...typography.statusCaps,
    fontSize: 11,
    letterSpacing: 0.6,
    color: '#ffffff',
  },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.input,
    backgroundColor: colors.onHeaderChip,
    borderWidth: 1,
    borderColor: colors.onHeaderChipBorder,
  },
  destText: { flex: 1, ...typography.bodySm, color: '#ffffff' },
  scroll: {
    paddingHorizontal: spacing.page,
    paddingTop: 22,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.xxl,
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    width: sizes.ringInner,
    height: sizes.ringInner,
    borderRadius: sizes.ringInner / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  clock: { ...typography.timer, color: colors.ink },
  clockCaps: { ...typography.labelCaps, color: colors.mutedCaps },
  detailCard: { width: '100%', gap: spacing.lg },
  taskTitle: { ...typography.cardTitleLg, color: colors.ink },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
  },
  stat: { flex: 1, gap: 3 },
  statRight: { paddingLeft: spacing.xl },
  statDivider: { width: 1, backgroundColor: colors.divider },
  statValue: { ...typography.statValue, color: colors.ink },
  statCaps: { ...typography.statCaps, color: colors.mutedCaps },
  trackingNote: { ...typography.micro, color: colors.secondaryAlt },
});

export default ActiveTaskScreen;

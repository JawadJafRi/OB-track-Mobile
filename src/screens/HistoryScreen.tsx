import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import GradientHeader from '../components/ui/GradientHeader';
import { Icon } from '../components/ui';
import { colors, shadows } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { listTasks } from '../api/tasks';
import type { Task, TaskStatus } from '../api/types';
import {
  formatClock,
  formatDuration,
  shortStatus,
} from '../utils/format';

const taskAltIcon = require('../assets/icons/task-alt.png');

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const PAGE_SIZE = 20;

const FILTERS: { label: string; value: TaskStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Done', value: 'COMPLETED' },
  { label: 'Running', value: 'IN_PROGRESS' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

type Section = { title: string; total: string; data: Task[] };

/** Day header label: "Today · 11 Sep", "Yesterday · 10 Sep", else "10 Sep 2026". */
function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const short = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  if (same(date, today)) {
    return `Today · ${short}`;
  }
  if (same(date, yesterday)) {
    return `Yesterday · ${short}`;
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(
    async (target: number, status: TaskStatus | 'ALL') => {
      const result = await listTasks({
        page: target,
        limit: PAGE_SIZE,
        status: status === 'ALL' ? undefined : status,
      });
      setHasNext(result.meta.hasNextPage);
      setPage(result.meta.page);
      return result.items;
    },
    [],
  );

  const load = useCallback(
    async (status: TaskStatus | 'ALL') => {
      setError('');
      try {
        setTasks(await fetchPage(1, status));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not load your history.',
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchPage],
  );

  useFocusEffect(
    useCallback(() => {
      load(filter);
    }, [load, filter]),
  );

  // Group by calendar day, with a per-day task count and total time.
  const sections: Section[] = useMemo(() => {
    const byDay = new Map<string, Task[]>();
    tasks.forEach(task => {
      const key = task.createdAt.slice(0, 10);
      const list = byDay.get(key);
      if (list) {
        list.push(task);
      } else {
        byDay.set(key, [task]);
      }
    });

    return Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, items]) => {
        const seconds = items.reduce(
          (sum, t) => sum + (t.durationSeconds ?? 0),
          0,
        );
        return {
          title: dayLabel(items[0]?.createdAt ?? key),
          total: `${items.length} task${items.length === 1 ? '' : 's'}${
            seconds > 0 ? ` · ${formatDuration(seconds)}` : ''
          }`,
          data: items,
        };
      });
  }, [tasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(filter);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || !hasNext) {
      return;
    }
    setLoadingMore(true);
    try {
      const items = await fetchPage(page + 1, filter);
      setTasks(previous => {
        const seen = new Set(previous.map(t => t.id));
        return [...previous, ...items.filter(t => !seen.has(t.id))];
      });
    } catch {
      // Silent — the next scroll retries; an alert here would be noise.
    } finally {
      setLoadingMore(false);
    }
  };

  const openTask = (task: Task) => {
    if (task.status === 'IN_PROGRESS') {
      navigation.navigate('ActiveTask', { taskId: task.id });
    } else if (task.status === 'COMPLETED') {
      navigation.navigate('TaskCompleted', { taskId: task.id });
    }
  };

  const renderItem = ({ item }: { item: Task }) => {
    const cancelled = item.status === 'CANCELLED';
    const tint = cancelled ? colors.muted : colors.primary;
    const iconBg = cancelled ? colors.rowDivider : colors.tintBg;

    const meta = item.startedAt
      ? `${formatClock(item.startedAt)}${
          item.endedAt ? ' – ' + formatClock(item.endedAt) : ''
        }${item.destination ? ' · ' + item.destination : ''}`
      : item.cancellationReason || 'Not started';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openTask(item)}
        style={styles.row}
      >
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          <Icon source={taskAltIcon} size={18} color={tint} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title || item.description}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowDuration}>
            {item.durationSeconds ? formatDuration(item.durationSeconds) : '—'}
          </Text>
          <Text style={[styles.rowStatus, { color: tint }]}>
            {shortStatus(item.status)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientFrom} />

      <GradientHeader paddingBottom={22}>
        <Text style={styles.title}>History</Text>
        <View style={styles.filterRow}>
          {FILTERS.map(item => {
            const on = filter === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.value !== filter) {
                    setFilter(item.value);
                    setLoading(true);
                    setTasks([]);
                  }
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? '#ffffff' : colors.onHeaderFilterBg,
                    borderColor: on ? '#ffffff' : colors.onHeaderFilterBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: on ? colors.ink : colors.onHeaderFilterText },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GradientHeader>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionTotal}>{section.total}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {error ? 'Could not load history' : 'Nothing here yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {error || 'Tasks you run will show up here.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.footerSpinner}
              />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  title: { ...typography.h1, color: '#ffffff' },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { ...typography.captionStrong },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: 9,
  },
  sectionTitle: { ...typography.statCaps, letterSpacing: 1.2, color: colors.mutedCaps },
  sectionTotal: { ...typography.micro, color: colors.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.listItem,
    padding: 15,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.itemTitle, color: colors.ink },
  rowMeta: { ...typography.caption, color: colors.secondaryAlt },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowDuration: { ...typography.itemTitle, color: colors.ink },
  rowStatus: { ...typography.statusCaps },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 60,
  },
  emptyTitle: { ...typography.cardTitle, color: colors.ink },
  emptyBody: {
    ...typography.caption,
    color: colors.secondaryAlt,
    textAlign: 'center',
  },
  footerSpinner: { paddingVertical: spacing.xl },
});

export default HistoryScreen;

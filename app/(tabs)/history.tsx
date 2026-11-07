import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEvents } from '@/db/useEvents';
import { isBackdated } from '@/domain/backdated';
import type { ReplayedEvent } from '@/domain/replay';
import { currentCount, replay } from '@/domain/replay';
import { buildCountSeries } from '@/domain/series';
import { formatDeltaLabel, formatEventCaption } from '@/ui/formatDelta';
import { fontFamilies } from '@/ui/fonts';
import { formatRelativeDayTime } from '@/ui/formatRelativeDayTime';
import { ClockIcon } from '@/ui/icons/ClockIcon';
import { NoteIcon } from '@/ui/icons/NoteIcon';
import { StepChart } from '@/ui/StepChart';
import { useThemeColors } from '@/ui/theme';
import { spacing } from '@/ui/tokens';

const CHART_HEIGHT = 150;

type Period = '90d' | '1y' | 'all';
const PERIODS: Period[] = ['90d', '1y', 'all'];
const PERIOD_LABELS: Record<Period, string> = { '90d': '90 days', '1y': '1 year', all: 'All' };

/** `null` means "all time" — see src/domain/series.ts's buildCountSeries. */
function periodStart(period: Period, now: Date): Date | null {
  if (period === 'all') return null;
  if (period === '90d') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 1);
  return start;
}

function formatAxisDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

interface LogRowProps {
  event: ReplayedEvent;
  isLast: boolean;
  onDelete: (event: ReplayedEvent) => void;
}

function LogRow({ event, isLast, onDelete }: LogRowProps) {
  const colors = useThemeColors();
  const hasNote = Boolean(event.note?.trim());
  const backdated = isBackdated(event);

  const chipColors =
    event.type === 'set'
      ? { bg: colors.outlineSoft, fg: colors.ink }
      : event.value >= 0
        ? { bg: colors.accentSoft, fg: colors.onAccentSoft }
        : { bg: colors.cool, fg: colors.onCool };

  const caption = formatEventCaption(event);
  const dateLabel = formatRelativeDayTime(event.occurredAt);

  return (
    <Pressable
      onLongPress={() => onDelete(event)}
      accessibilityLabel={`${formatDeltaLabel(event)}, ${dateLabel}, ${caption}, resulting ${event.resultingValue} cans${backdated ? ', entered later' : ''}`}
      accessibilityHint="Double tap and hold to delete this entry"
      style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.outlineSoft }]}
    >
      <View style={[styles.chip, { backgroundColor: chipColors.bg }]}>
        <Text style={[styles.chipLabel, { color: chipColors.fg, fontFamily: fontFamilies.bodyBold }]}>{formatDeltaLabel(event)}</Text>
      </View>

      <View style={styles.rowMiddle}>
        <View style={styles.rowDateLine}>
          <Text style={[styles.rowDate, { color: colors.ink, fontFamily: fontFamilies.bodySemiBold }]}>{dateLabel}</Text>
          {backdated && (
            <View accessibilityLabel="Entered later">
              <ClockIcon size={13} color={colors.inkMuted} strokeWidth={2} />
            </View>
          )}
        </View>
        <View style={styles.rowCaptionLine}>
          {hasNote && <NoteIcon size={14} color={colors.inkMuted} strokeWidth={2} />}
          <Text numberOfLines={1} style={[styles.rowCaption, { color: hasNote ? colors.ink : colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>
            {caption}
          </Text>
        </View>
      </View>

      <Text style={[styles.rowValue, { color: colors.ink, fontFamily: fontFamilies.bodyBold }]}>{event.resultingValue}</Text>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { events, removeEvent, refresh } = useEvents();
  const [period, setPeriod] = useState<Period>('90d');

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const rows = useMemo(() => [...replay(events)].reverse(), [events]);

  const count = currentCount(events);
  const now = new Date();
  const series = buildCountSeries(events, periodStart(period, now), now);
  const seriesValues = series.map((p) => p.value);
  const seriesMin = Math.min(...seriesValues);
  const seriesMax = Math.max(...seriesValues);
  const chartWidth = Math.max(0, windowWidth - spacing.screenPadding * 2 - 32);

  const confirmDelete = useCallback(
    (event: ReplayedEvent) => {
      Alert.alert('Delete this entry?', 'The pantry count will be recalculated without it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeEvent(event.id) },
      ]);
    },
    [removeEvent]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.ink, fontFamily: fontFamilies.displayExtraBold }]}>History</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>All your pantry changes</Text>
        </View>

        <View style={[styles.periodSelector, { backgroundColor: colors.lidOuter }]}>
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              accessibilityRole="tab"
              accessibilityState={{ selected: period === p }}
              onPress={() => setPeriod(p)}
              hitSlop={{ top: 4, bottom: 4 }}
              style={[styles.periodOption, period === p && { backgroundColor: colors.surface }]}
            >
              <Text
                style={[
                  styles.periodLabel,
                  { color: colors.ink, fontFamily: period === p ? fontFamilies.bodyBold : fontFamilies.bodySemiBold },
                ]}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <View style={styles.chartHeaderRow}>
            <View style={styles.chartValueRow}>
              <Text style={[styles.chartValue, { color: colors.ink, fontFamily: fontFamilies.displayBold }]}>{count}</Text>
              <Text style={[styles.chartValueLabel, { color: colors.inkMuted, fontFamily: fontFamilies.bodyMedium }]}>today</Text>
            </View>
            <Text style={[styles.chartMinMax, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>
              min {seriesMin} · max {seriesMax}
            </Text>
          </View>

          <View accessibilityLabel={`Step chart of the can count for the selected period: currently ${count}, minimum ${seriesMin}, maximum ${seriesMax}`}>
            <StepChart points={series} width={chartWidth} height={CHART_HEIGHT} />
          </View>

          <View style={styles.chartAxisRow}>
            <Text style={[styles.chartAxisLabel, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>
              {formatAxisDate(series[0].at)}
            </Text>
            <Text style={[styles.chartAxisLabel, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>
              {formatAxisDate(new Date((Date.parse(series[0].at) + now.getTime()) / 2).toISOString())}
            </Text>
            <Text style={[styles.chartAxisLabel, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>today</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink, fontFamily: fontFamilies.bodyBold }]}>Change log</Text>
          <Text style={[styles.sectionCount, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          {rows.length === 0 ? (
            <Text style={[styles.empty, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>No entries yet.</Text>
          ) : (
            rows.map((event, index) => <LogRow key={event.id} event={event} isLast={index === rows.length - 1} onDelete={confirmDelete} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    gap: 16,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 26,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
  },
  sectionCount: {
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 14,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: {
    fontSize: 14,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  chartValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  chartValue: {
    fontSize: 28,
  },
  chartValueLabel: {
    fontSize: 14,
  },
  chartMinMax: {
    fontSize: 13,
  },
  chartAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartAxisLabel: {
    fontSize: 12,
  },
  empty: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chip: {
    width: 44,
    height: 32,
    flexShrink: 0,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 15,
  },
  rowMiddle: {
    flex: 1,
    gap: 2,
  },
  rowDateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowDate: {
    fontSize: 15,
  },
  rowCaptionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowCaption: {
    fontSize: 13,
    flexShrink: 1,
  },
  rowValue: {
    fontSize: 15,
  },
});

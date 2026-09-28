import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEvents } from '@/db/useEvents';
import { isBackdated } from '@/domain/backdated';
import type { ReplayedEvent } from '@/domain/replay';
import { replay } from '@/domain/replay';
import { formatDeltaLabel, formatEventCaption } from '@/ui/formatDelta';
import { fontFamilies } from '@/ui/fonts';
import { formatRelativeDayTime } from '@/ui/formatRelativeDayTime';
import { ClockIcon } from '@/ui/icons/ClockIcon';
import { NoteIcon } from '@/ui/icons/NoteIcon';
import { useThemeColors } from '@/ui/theme';
import { spacing } from '@/ui/tokens';

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
  const { events, removeEvent, refresh } = useEvents();

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const rows = useMemo(() => [...replay(events)].reverse(), [events]);

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

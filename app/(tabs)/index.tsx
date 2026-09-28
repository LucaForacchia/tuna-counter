import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEvents } from '@/db/useEvents';
import type { ReplayedEvent } from '@/domain/replay';
import { generateEventId } from '@/domain/id';
import { currentCount, replay } from '@/domain/replay';
import { validateNewEvent } from '@/domain/validate';
import { formatRelativeDayTime } from '@/ui/formatRelativeDayTime';
import { fontFamilies } from '@/ui/fonts';
import { MinusIcon } from '@/ui/icons/MinusIcon';
import { SettingsIcon } from '@/ui/icons/SettingsIcon';
import { Snackbar } from '@/ui/Snackbar';
import { useThemeColors } from '@/ui/theme';
import { spacing } from '@/ui/tokens';

function formatDeltaLabel(event: Pick<ReplayedEvent, 'type' | 'value'>): string {
  if (event.type === 'set') return `= ${event.value}`;
  return event.value >= 0 ? `+${event.value}` : `${event.value}`;
}

export default function PantryScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { events, addEvent, removeEvent } = useEvents();
  const [pendingUndo, setPendingUndo] = useState<string | null>(null);

  const count = currentCount(events);
  const lastEvent = useMemo(() => replay(events).at(-1), [events]);

  const consumeOne = useCallback(() => {
    if (count <= 0) return;
    const now = new Date().toISOString();
    const candidate = { id: generateEventId(), occurredAt: now, recordedAt: now, type: 'delta' as const, value: -1 };
    if (!validateNewEvent(events, candidate).ok) return;

    addEvent(candidate);
    setPendingUndo(candidate.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [count, events, addEvent]);

  const undoLastConsume = useCallback(() => {
    if (!pendingUndo) return;
    removeEvent(pendingUndo);
    setPendingUndo(null);
  }, [pendingUndo, removeEvent]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTitles}>
          <Text style={[styles.appTitle, { color: colors.ink, fontFamily: fontFamilies.displayExtraBold }]}>Tuna Counter</Text>
          <Text style={[styles.appSubtitle, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>Your tuna pantry</Text>
        </View>
        <Pressable
          accessibilityLabel="Backup and settings"
          onPress={() => router.push('/backup')}
          style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
        >
          <SettingsIcon size={22} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.lidOuter, { backgroundColor: colors.lidOuter }]}>
          <View style={[styles.lidInner, { backgroundColor: colors.surface, borderColor: colors.lidRim }]}>
            <View style={[styles.pullTab, { backgroundColor: colors.lidRim }]} />
            <Text style={[styles.count, { color: colors.ink, fontFamily: fontFamilies.displayExtraBold }]}>{count}</Text>
            <Text style={[styles.cansLabel, { color: colors.inkMuted, fontFamily: fontFamilies.bodySemiBold }]}>cans</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            accessibilityLabel="Use one can"
            disabled={count <= 0}
            onPress={consumeOne}
            style={[styles.consumeButton, { backgroundColor: colors.accent, opacity: count <= 0 ? 0.4 : 1 }]}
          >
            <MinusIcon size={52} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>
          <Pressable
            accessibilityLabel="Adjust quantity"
            onPress={() => router.push('/adjust')}
            style={[styles.adjustButton, { borderColor: colors.ink, backgroundColor: colors.surface }]}
          >
            <Text style={[styles.adjustLabel, { color: colors.ink, fontFamily: fontFamilies.displayBold }]}>± n</Text>
            <Text style={[styles.adjustCaption, { color: colors.inkMuted, fontFamily: fontFamilies.bodySemiBold }]}>Adjust</Text>
          </Pressable>
        </View>
        <Text style={[styles.helper, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>Tap − when you open a can</Text>

        <View style={[styles.lastChangeCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <View>
            <Text style={[styles.lastChangeLabel, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>Last change</Text>
            <Text style={[styles.lastChangeValue, { color: colors.ink, fontFamily: fontFamilies.bodySemiBold }]}>
              {lastEvent ? `${formatDeltaLabel(lastEvent)} · ${formatRelativeDayTime(lastEvent.occurredAt)}` : '—'}
            </Text>
          </View>
          <Pressable accessibilityLabel="Go to history" onPress={() => router.push('/history')}>
            <Text style={[styles.historyLink, { color: colors.accent, fontFamily: fontFamilies.bodyBold }]}>History →</Text>
          </Pressable>
        </View>
      </View>

      <Snackbar visible={pendingUndo !== null} message="Used one can" actionLabel="Undo" onAction={undoLastConsume} onDismiss={() => setPendingUndo(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 8,
  },
  headerTitles: {
    gap: 2,
  },
  appTitle: {
    fontSize: 26,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: spacing.screenPadding,
  },
  lidOuter: {
    width: 272,
    height: 272,
    borderRadius: 136,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lidInner: {
    width: 244,
    height: 244,
    borderRadius: 122,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pullTab: {
    width: 64,
    height: 10,
    borderRadius: 5,
    marginBottom: 14,
  },
  count: {
    fontSize: 104,
    lineHeight: 104,
    letterSpacing: -4,
    fontVariant: ['tabular-nums'],
  },
  cansLabel: {
    fontSize: 15,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  consumeButton: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  adjustButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustLabel: {
    fontSize: 24,
    lineHeight: 24,
  },
  adjustCaption: {
    fontSize: 12,
    marginTop: 4,
  },
  helper: {
    fontSize: 14,
    marginTop: -12,
  },
  lastChangeCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastChangeLabel: {
    fontSize: 13,
  },
  lastChangeValue: {
    fontSize: 16,
    marginTop: 2,
  },
  historyLink: {
    fontSize: 15,
  },
});

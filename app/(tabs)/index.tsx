import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEvents } from '@/db/useEvents';
import { generateEventId } from '@/domain/id';
import { currentCount, replay } from '@/domain/replay';
import { validateNewEvent } from '@/domain/validate';
import { formatDeltaLabel } from '@/ui/formatDelta';
import { formatRelativeDayTime } from '@/ui/formatRelativeDayTime';
import { fontFamilies } from '@/ui/fonts';
import { MinusIcon } from '@/ui/icons/MinusIcon';
import { PlusIcon } from '@/ui/icons/PlusIcon';
import { SettingsIcon } from '@/ui/icons/SettingsIcon';
import { Snackbar } from '@/ui/Snackbar';
import { useThemeColors } from '@/ui/theme';
import { spacing } from '@/ui/tokens';

/** Shown once, when the DB has no events yet — creates the only `set` event the UI normally generates. */
function FirstRunSetup({ onDone }: { onDone: (initialCount: number) => void }) {
  const colors = useThemeColors();
  const [value, setValue] = useState(1);

  return (
    <View style={[styles.screen, styles.setupScreen, { backgroundColor: colors.background }]}>
      <Text style={[styles.setupTitle, { color: colors.ink, fontFamily: fontFamilies.displayExtraBold }]}>How many cans do you have?</Text>
      <Text style={[styles.setupSubtitle, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>
        Set your starting count once — from here on you just use Add/Remove.
      </Text>

      <View style={[styles.quantityRow, { borderColor: colors.outline }]}>
        <Pressable
          accessibilityLabel="Decrease"
          onPress={() => setValue((v) => Math.max(0, v - 1))}
          style={[styles.stepper, { borderColor: colors.outline, backgroundColor: colors.surface }]}
        >
          <MinusIcon size={24} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
        <TextInput
          value={String(value)}
          onChangeText={(text) => {
            const parsed = Number(text.replace(/[^0-9]/g, ''));
            setValue(Number.isInteger(parsed) ? parsed : 0);
          }}
          keyboardType="numeric"
          style={[styles.quantityInput, { borderColor: colors.ink, color: colors.ink, fontFamily: fontFamilies.displayExtraBold }]}
        />
        <Pressable
          accessibilityLabel="Increase"
          onPress={() => setValue((v) => v + 1)}
          style={[styles.stepper, { borderColor: colors.outline, backgroundColor: colors.surface }]}
        >
          <PlusIcon size={24} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
      </View>

      <Pressable onPress={() => onDone(value)} style={[styles.setupButton, { backgroundColor: colors.accent }]}>
        <Text style={[styles.buttonLabel, { color: '#FFFFFF', fontFamily: fontFamilies.bodyBold }]}>Get started</Text>
      </Pressable>
    </View>
  );
}

export default function PantryScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { events, isLoaded, addEvent, removeEvent, refresh } = useEvents();
  const [pendingUndo, setPendingUndo] = useState<string | null>(null);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const count = currentCount(events);
  const lastEvent = useMemo(() => replay(events).at(-1), [events]);

  const finishSetup = useCallback(
    (initialCount: number) => {
      const now = new Date().toISOString();
      addEvent({ id: generateEventId(), occurredAt: now, recordedAt: now, type: 'set', value: initialCount });
    },
    [addEvent]
  );

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

  if (isLoaded && events.length === 0) {
    return <FirstRunSetup onDone={finishSetup} />;
  }

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
  setupScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: spacing.screenPadding,
  },
  setupTitle: {
    fontSize: 26,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  stepper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 120,
    height: 64,
    borderWidth: 2,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 44,
  },
  setupButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
  },
});

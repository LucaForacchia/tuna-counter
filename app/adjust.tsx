import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useEvents } from '@/db/useEvents';
import { generateEventId } from '@/domain/id';
import { currentCount } from '@/domain/replay';
import { validateNewEvent, type EventValidationErrorType } from '@/domain/validate';
import { fontFamilies } from '@/ui/fonts';
import { formatRelativeDayTime } from '@/ui/formatRelativeDayTime';
import { MinusIcon } from '@/ui/icons/MinusIcon';
import { PlusIcon } from '@/ui/icons/PlusIcon';
import { useThemeColors } from '@/ui/theme';

type Mode = 'add' | 'remove';

const ERROR_MESSAGES: Record<EventValidationErrorType, string> = {
  'future-occurred-at': "The date and time can't be in the future.",
  'non-integer-value': 'The quantity must be a whole number.',
  'would-go-negative': "That would take the pantry below 0 at some point in its history.",
};

function combineDateAndTime(date: Date, time: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes());
}

export default function AdjustScreen() {
  const colors = useThemeColors();
  const { events, addEvent } = useEvents();
  const count = currentCount(events);

  const [mode, setMode] = useState<Mode>('add');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [pickerStage, setPickerStage] = useState<'closed' | 'date' | 'time'>('closed');
  const [error, setError] = useState<string | null>(null);

  const afterSaving = mode === 'add' ? count + quantity : count - quantity;

  const setQuantityFromText = useCallback((text: string) => {
    const parsed = Number(text.replace(/[^0-9]/g, ''));
    setQuantity(Number.isInteger(parsed) && parsed > 0 ? parsed : 1);
  }, []);

  const onDatePicked = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'dismissed' || !selected) {
        setPickerStage('closed');
        return;
      }
      setOccurredAt((prev) => combineDateAndTime(selected, prev));
      setPickerStage('time');
    },
    []
  );

  const onTimePicked = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      setPickerStage('closed');
      if (event.type === 'dismissed' || !selected) return;
      setOccurredAt((prev) => combineDateAndTime(prev, selected));
    },
    []
  );

  const onSave = useCallback(() => {
    const now = new Date().toISOString();
    const candidate = {
      id: generateEventId(),
      occurredAt: occurredAt.toISOString(),
      recordedAt: now,
      type: 'delta' as const,
      value: mode === 'add' ? quantity : -quantity,
      note: note.trim() || undefined,
    };

    const result = validateNewEvent(events, candidate);
    if (!result.ok) {
      setError(ERROR_MESSAGES[result.errors[0]]);
      return;
    }
    addEvent(candidate);
    router.back();
  }, [events, occurredAt, mode, quantity, note, addEvent]);

  return (
    <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
      <View style={[styles.handle, { backgroundColor: colors.lidRim }]} />

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.ink, fontFamily: fontFamilies.displayBold }]}>Adjust quantity</Text>
        <Text style={[styles.subtitle, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>Currently in the pantry: {count} cans</Text>
      </View>

      <View style={[styles.segmented, { backgroundColor: colors.background }]}>
        {(['add', 'remove'] as const).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === m }}
            onPress={() => setMode(m)}
            hitSlop={{ top: 2, bottom: 2 }}
            style={[styles.segmentedOption, mode === m && { backgroundColor: colors.ink }]}
          >
            <Text
              style={[
                styles.segmentedLabel,
                { color: mode === m ? '#FFFFFF' : colors.ink, fontFamily: mode === m ? fontFamilies.bodyBold : fontFamilies.bodySemiBold },
              ]}
            >
              {m === 'add' ? 'Add' : 'Remove'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink, fontFamily: fontFamilies.bodySemiBold }]}>Quantity</Text>
        <View style={[styles.quantityRow, { borderColor: colors.outline }]}>
          <Pressable
            accessibilityLabel="Decrease"
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={[styles.stepper, { borderColor: colors.outline, backgroundColor: colors.surface }]}
          >
            <MinusIcon size={24} color={colors.ink} strokeWidth={2.2} />
          </Pressable>
          <TextInput
            value={String(quantity)}
            onChangeText={setQuantityFromText}
            keyboardType="numeric"
            maxFontSizeMultiplier={1.2}
            style={[styles.quantityInput, { borderColor: colors.ink, color: colors.ink, fontFamily: fontFamilies.displayExtraBold }]}
          />
          <Pressable
            accessibilityLabel="Increase"
            onPress={() => setQuantity((q) => q + 1)}
            style={[styles.stepper, { borderColor: colors.outline, backgroundColor: colors.surface }]}
          >
            <PlusIcon size={24} color={colors.ink} strokeWidth={2.2} />
          </Pressable>
        </View>
        <Text style={[styles.helper, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>Tap the number to type it directly</Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink, fontFamily: fontFamilies.bodySemiBold }]}>
          Note <Text style={{ color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }}>(optional)</Text>
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Weekly groceries"
          placeholderTextColor={colors.inkMuted}
          multiline
          style={[styles.noteInput, { borderColor: colors.outline, color: colors.ink, fontFamily: fontFamilies.bodyRegular }]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink, fontFamily: fontFamilies.bodySemiBold }]}>Date and time</Text>
        <Pressable onPress={() => setPickerStage('date')} style={[styles.dateField, { borderColor: colors.outline }]}>
          <Text style={{ color: colors.ink, fontFamily: fontFamilies.bodyRegular, fontSize: 16 }}>{formatRelativeDayTime(occurredAt.toISOString())}</Text>
        </Pressable>
      </View>

      {pickerStage === 'date' && <DateTimePicker value={occurredAt} mode="date" maximumDate={new Date()} onChange={onDatePicked} />}
      {pickerStage === 'time' && <DateTimePicker value={occurredAt} mode="time" onChange={onTimePicked} />}

      <View style={[styles.previewBox, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.ink, fontFamily: fontFamilies.bodyRegular, fontSize: 15 }}>
          After saving: <Text style={{ fontFamily: fontFamilies.bodyBold }}>{afterSaving} cans</Text>
        </Text>
      </View>

      {error && <Text style={[styles.error, { color: colors.accent, fontFamily: fontFamilies.bodyMedium }]}>{error}</Text>}

      <View style={styles.actions}>
        <Pressable onPress={() => router.back()} style={[styles.button, styles.cancelButton, { borderColor: colors.ink }]}>
          <Text style={[styles.buttonLabel, { color: colors.ink, fontFamily: fontFamilies.bodyBold }]}>Cancel</Text>
        </Pressable>
        <Pressable onPress={onSave} style={[styles.button, { backgroundColor: colors.accent }]}>
          <Text style={[styles.buttonLabel, { color: '#FFFFFF', fontFamily: fontFamilies.bodyBold }]}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 15,
  },
  segmented: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 14,
    padding: 4,
  },
  segmentedOption: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedLabel: {
    fontSize: 15,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
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
  helper: {
    fontSize: 13,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  dateField: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  previewBox: {
    borderRadius: 14,
    padding: 14,
  },
  error: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonLabel: {
    fontSize: 16,
  },
});

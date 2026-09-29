import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { useEvents } from '@/db/useEvents';
import { buildDemoEvents } from '@/domain/demoData';
import { fontFamilies } from './fonts';
import { useThemeColors } from './theme';

/** Development-only: replaces the whole log with 90 days of sample history. Render it under `__DEV__` only. */
export function DevDemoDataButton() {
  const colors = useThemeColors();
  const { replaceEvents } = useEvents();

  const confirmAndLoad = () =>
    Alert.alert('Load demo data?', 'This replaces ALL existing events with a 90-day sample history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Replace', style: 'destructive', onPress: () => replaceEvents(buildDemoEvents(new Date())) },
    ]);

  return (
    <Pressable onPress={confirmAndLoad} style={[styles.button, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
      <Text style={[styles.label, { color: colors.ink, fontFamily: fontFamilies.bodySemiBold }]}>DEV · Load demo data</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15 },
});

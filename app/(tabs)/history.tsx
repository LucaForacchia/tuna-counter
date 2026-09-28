import { StyleSheet, Text, View } from 'react-native';

import { fontFamilies } from '@/ui/fonts';
import { useThemeColors } from '@/ui/theme';

export default function HistoryScreen() {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.ink, fontFamily: fontFamilies.bodyMedium }]}>Storico — in arrivo (passi 7-8 del piano)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 16, textAlign: 'center' },
});

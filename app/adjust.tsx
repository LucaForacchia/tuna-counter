import { StyleSheet, Text, View } from 'react-native';

import { fontFamilies } from '@/ui/fonts';
import { useThemeColors } from '@/ui/theme';

export default function AdjustScreen() {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.ink, fontFamily: fontFamilies.bodyMedium }]}>Pannello Modifica — in arrivo (passo 6 del piano)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 16, textAlign: 'center' },
});

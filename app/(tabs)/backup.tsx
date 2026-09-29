import { StyleSheet, Text, View } from 'react-native';

import { DevDemoDataButton } from '@/ui/DevDemoDataButton';
import { fontFamilies } from '@/ui/fonts';
import { useThemeColors } from '@/ui/theme';

export default function BackupScreen() {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.ink, fontFamily: fontFamilies.bodyMedium }]}>Backup — in arrivo (passo 9 del piano)</Text>
      {__DEV__ && <DevDemoDataButton />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 },
  text: { fontSize: 16, textAlign: 'center' },
});

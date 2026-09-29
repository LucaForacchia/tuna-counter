import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CONTACT_EMAIL, PRIVACY_POLICY_URL } from '@/config/about';
import { fontFamilies } from '@/ui/fonts';
import { useThemeColors } from '@/ui/theme';
import { radius, sizes, spacing } from '@/ui/tokens';

interface RowProps {
  label: string;
  value: string;
  onPress?: () => void;
}

function Row({ label, value, onPress }: RowProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole={onPress ? 'link' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, { borderTopColor: colors.outlineSoft }]}
    >
      <Text style={[styles.rowLabel, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: onPress ? colors.accent : colors.ink, fontFamily: fontFamilies.bodySemiBold }]}>{value}</Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
    >
      <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Text style={[styles.backLabel, { color: colors.accent, fontFamily: fontFamilies.bodyBold }]}>← Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink, fontFamily: fontFamilies.displayExtraBold }]}>About</Text>
        <Text style={[styles.subtitle, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>Tuna Counter</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text style={[styles.blurb, { color: colors.ink, fontFamily: fontFamilies.bodyRegular }]}>
          Everything you enter stays on this device. Tuna Counter collects no data and needs no account or permissions. Backups are CSV files that you
          save and manage yourself.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Row label="Version" value={version} />
        <Row label="Package" value="com.ibob_42.tunacounter" />
        {PRIVACY_POLICY_URL && <Row label="Privacy policy" value="Open" onPress={() => Linking.openURL(PRIVACY_POLICY_URL!)} />}
        {CONTACT_EMAIL && <Row label="Contact" value={CONTACT_EMAIL} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screenPadding, gap: 16 },
  back: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center' },
  backLabel: { fontSize: 16 },
  header: { gap: 2, paddingBottom: 4 },
  title: { fontSize: 26, letterSpacing: -0.5 },
  subtitle: { fontSize: 14 },
  card: { borderWidth: sizes.cardBorderWidth, borderRadius: radius.cardLarge, paddingHorizontal: 18, overflow: 'hidden' },
  blurb: { fontSize: 15, lineHeight: 22, paddingVertical: 18 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1 },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 15, flexShrink: 1, textAlign: 'right' },
});

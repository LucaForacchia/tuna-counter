import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { readSetting, useEvents, writeSetting } from '@/db/useEvents';
import { CSV_HEADER, parseEventsCsv } from '@/domain/csv';
import { formatImportSummary, planImport, type ImportMode } from '@/domain/importPlan';
import { pickBackupFile, exportBackup } from '@/ui/backupFiles';
import { DevDemoDataButton } from '@/ui/DevDemoDataButton';
import { fontFamilies } from '@/ui/fonts';
import { DownloadIcon } from '@/ui/icons/DownloadIcon';
import { UploadIcon } from '@/ui/icons/UploadIcon';
import { useThemeColors } from '@/ui/theme';
import { radius, sizes, spacing } from '@/ui/tokens';

const LAST_EXPORT_KEY = 'last_export_at';

const SAMPLE_CSV = `${CSV_HEADER}
3f2c…,2026-09-24T18:02:00+02:00,2026-09-24T18:02:31+02:00,set,12,"Weekly groceries"
9ab1…,2026-09-27T20:15:00+02:00,2026-09-27T20:15:00+02:00,delta,-1,
c07e…,2026-09-28T12:40:00+02:00,2026-09-28T12:40:00+02:00,delta,-1,`;

const IMPORT_ERRORS = {
  'unrecognized-file': ["This isn't a Tuna Counter backup", 'The file header was not recognized. Nothing was changed.'],
  'would-go-negative': ['Import would break the count', 'With this file the pantry would drop below 0 at some point in its history. Nothing was changed.'],
} as const;

function formatLastExport(iso: string | null): string {
  if (!iso) return 'never';
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBackground: string;
  children: React.ReactNode;
}

function ActionCard({ title, description, icon, iconBackground, children }: CardProps) {
  const colors = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconTile, { backgroundColor: iconBackground }]}>{icon}</View>
        <View style={styles.cardTitles}>
          <Text style={[styles.cardTitle, { color: colors.ink, fontFamily: fontFamilies.bodyBold }]}>{title}</Text>
          <Text style={[styles.cardDescription, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>{description}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export default function BackupScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { events, addEvents, replaceEvents } = useEvents();
  const [lastExport, setLastExport] = useState<string | null>(() => readSetting(LAST_EXPORT_KEY));
  const [busy, setBusy] = useState(false);

  const onExport = useCallback(async () => {
    setBusy(true);
    try {
      await exportBackup(events);
      const now = new Date().toISOString();
      writeSetting(LAST_EXPORT_KEY, now);
      setLastExport(now);
    } catch (error) {
      Alert.alert("Couldn't export", error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, [events]);

  const applyImport = useCallback(
    (parsed: ReturnType<typeof parseEventsCsv>, mode: ImportMode) => {
      const plan = planImport(events, parsed, mode);
      if (!plan.ok) {
        const [title, message] = IMPORT_ERRORS[plan.error];
        Alert.alert(title, message);
        return;
      }
      try {
        if (mode === 'replace') replaceEvents(plan.eventsToWrite);
        else addEvents(plan.eventsToWrite);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        Alert.alert("Couldn't import", `The database refused the write, nothing was changed.\n\n${reason}`);
        return;
      }
      Alert.alert('Import complete', formatImportSummary(plan.summary));
    },
    [events, addEvents, replaceEvents]
  );

  const onImport = useCallback(async () => {
    setBusy(true);
    try {
      const picked = await pickBackupFile();
      if (!picked) return;
      if ('tooLarge' in picked) {
        Alert.alert('File too large', 'Backups larger than 10 MB are not supported. Nothing was changed.');
        return;
      }

      const parsed = parseEventsCsv(picked.text);
      const validCount = parsed.events.length;
      Alert.alert(`Import "${picked.name}"?`, `The file contains ${validCount} ${validCount === 1 ? 'event' : 'events'}.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace…',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Replace all data?', `This deletes your ${events.length} current events and loads the file instead. This cannot be undone.`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Replace', style: 'destructive', onPress: () => applyImport(parsed, 'replace') },
            ]),
        },
        { text: 'Merge', onPress: () => applyImport(parsed, 'merge') },
      ]);
    } catch (error) {
      Alert.alert("Couldn't read the file", error instanceof Error ? error.message : 'Something went wrong. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  }, [events.length, applyImport]);

  const onReset = useCallback(() => {
    Alert.alert('Reset everything?', 'This deletes the whole history and starts over from a new starting count. Export a backup first if you might need it. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => replaceEvents([]) },
    ]);
  }, [replaceEvents]);

  const version = Constants.expoConfig?.version ?? '';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink, fontFamily: fontFamilies.displayExtraBold }]}>Backup</Text>
        <Text style={[styles.subtitle, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>Export or restore your data as CSV</Text>
      </View>

      <ActionCard
        title="Export CSV"
        description="Save the count and full change log to a file (Drive, Downloads…)"
        icon={<DownloadIcon size={22} color={colors.onAccentSoft} />}
        iconBackground={colors.accentSoft}
      >
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onExport}
          style={[styles.pillButton, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
        >
          <Text style={[styles.pillLabel, { color: '#FFFFFF', fontFamily: fontFamilies.bodyBold }]}>Export now</Text>
        </Pressable>
        <Text style={[styles.footnote, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>Last export: {formatLastExport(lastExport)}</Text>
      </ActionCard>

      <ActionCard
        title="Import CSV"
        description="Restore from a backup. You choose whether to merge with or replace current data."
        icon={<UploadIcon size={22} color={colors.onCool} />}
        iconBackground={colors.cool}
      >
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onImport}
          style={[styles.pillButton, { borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.surface, opacity: busy ? 0.6 : 1 }]}
        >
          <Text style={[styles.pillLabel, { color: colors.ink, fontFamily: fontFamilies.bodyBold }]}>Choose file…</Text>
        </Pressable>
      </ActionCard>

      <View style={styles.formatBlock}>
        <Text style={[styles.formatTitle, { color: colors.ink, fontFamily: fontFamilies.bodyBold }]}>File format</Text>
        <View style={[styles.sample, { backgroundColor: colors.ink }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[styles.sampleText, { color: colors.background }]}>{SAMPLE_CSV}</Text>
          </ScrollView>
        </View>
      </View>

      <View style={styles.dangerBlock}>
        <Pressable accessibilityRole="button" onPress={onReset} style={styles.resetButton}>
          <Text style={[styles.resetLabel, { color: colors.accent, fontFamily: fontFamilies.bodyBold }]}>Reset all data…</Text>
        </Pressable>
        {__DEV__ && <DevDemoDataButton />}
      </View>

      <Pressable accessibilityRole="link" onPress={() => router.push('/about')} style={styles.aboutLink}>
        <Text style={[styles.about, { color: colors.inkMuted, fontFamily: fontFamilies.bodyRegular }]}>
          About · Tuna Counter{version ? ` v${version}` : ''}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screenPadding, paddingBottom: 24, gap: 16 },
  header: { gap: 2, paddingBottom: 4 },
  title: { fontSize: 26, letterSpacing: -0.5 },
  subtitle: { fontSize: 14 },
  card: { borderWidth: sizes.cardBorderWidth, borderRadius: radius.cardLarge, padding: 18, gap: 14 },
  cardHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconTile: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitles: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17 },
  cardDescription: { fontSize: 14 },
  pillButton: { height: sizes.pillButtonHeight, borderRadius: sizes.pillButtonHeight / 2, alignItems: 'center', justifyContent: 'center' },
  pillLabel: { fontSize: 16 },
  footnote: { fontSize: 13 },
  formatBlock: { gap: 8 },
  formatTitle: { fontSize: 14 },
  sample: { borderRadius: 14, padding: 14 },
  sampleText: { fontFamily: Platform.select({ android: 'monospace', default: 'Courier' }), fontSize: 12, lineHeight: 19 },
  dangerBlock: { alignItems: 'center', gap: 12, paddingTop: 8 },
  resetButton: { minHeight: 48, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  resetLabel: { fontSize: 15 },
  aboutLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  about: { fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
});

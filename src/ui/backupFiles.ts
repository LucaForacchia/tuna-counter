import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { backupFileName, serializeEventsToCsv } from '@/domain/csv';
import type { DomainEvent } from '@/domain/events';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

/** Writes the CSV to the app's cache folder and opens the system share sheet (Drive, mail, Downloads…). */
export async function exportBackup(events: readonly DomainEvent[]): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');

  const file = new File(Paths.cache, backupFileName());
  file.create({ overwrite: true });
  file.write(serializeEventsToCsv(events));

  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Save Tuna Counter backup' });
}

export type PickedBackup = { name: string; text: string } | { tooLarge: true } | null;

/** Opens the system file picker; `null` if the user cancelled. Nothing is read beyond the chosen file. */
export async function pickBackupFile(): Promise<PickedBackup> {
  // Android often reports CSVs as octet-stream or plain text, so filtering by MIME type would hide valid files;
  // the CSV parser rejects anything that isn't a Tuna Counter backup.
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (asset.size !== undefined && asset.size > MAX_IMPORT_BYTES) return { tooLarge: true };
  return { name: asset.name, text: await new File(asset.uri).text() };
}

import type { Migration } from './schema';

/** Migrations with `version` greater than `currentVersion`, in the order to apply them. */
export function pendingMigrations(currentVersion: number, allMigrations: readonly Migration[]): Migration[] {
  return allMigrations.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);
}

/** Guards against copy-paste mistakes: every migration needs a distinct version, numbered 1, 2, 3, ... with no gaps. */
export function assertMigrationsAreWellFormed(allMigrations: readonly Migration[]): void {
  const versions = allMigrations.map((m) => m.version);
  const expected = allMigrations.map((_, i) => i + 1);
  const sorted = [...versions].sort((a, b) => a - b);
  if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
    throw new Error(`migration versions must be exactly 1..${allMigrations.length}, got [${versions.join(', ')}]`);
  }
}

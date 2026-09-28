export interface Migration {
  version: number;
  description: string;
  /** SQL statements applied in order, inside one transaction */
  statements: string[];
}

/**
 * Never edit a migration once it has shipped (its SQL text is pinned by a
 * test) — add a new one instead, even to fix a mistake. Versions are
 * PRAGMA user_version numbers, applied in order starting from the device's
 * current version.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    description: 'create events table',
    statements: [
      `CREATE TABLE events (
        id TEXT PRIMARY KEY NOT NULL,
        occurred_at TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        type TEXT NOT NULL,
        value INTEGER NOT NULL,
        note TEXT
      )`,
      'CREATE INDEX events_occurred_at ON events (occurred_at)',
    ],
  },
];

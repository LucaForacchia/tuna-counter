import * as SQLite from 'expo-sqlite';

import type { DomainEvent } from '../domain/events';
import { pendingMigrations } from './migrate';
import { eventToInsertParams, rowToEvent, type EventRow } from './rows';
import { migrations } from './schema';

const DB_NAME = 'tunacounter.db';

export type Database = SQLite.SQLiteDatabase;

export function openDatabase(): Database {
  return SQLite.openDatabaseSync(DB_NAME);
}

/** Applies every migration newer than the database's current PRAGMA user_version, in order, each in its own transaction. */
export function migrate(db: Database): void {
  const currentVersion = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;

  for (const migration of pendingMigrations(currentVersion, migrations)) {
    db.withTransactionSync(() => {
      for (const statement of migration.statements) {
        db.execSync(statement);
      }
      db.execSync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

export function insertEvent(db: Database, event: DomainEvent): void {
  db.runSync(
    'INSERT INTO events (id, occurred_at, recorded_at, type, value, note) VALUES (?, ?, ?, ?, ?, ?)',
    eventToInsertParams(event)
  );
}

export function listEvents(db: Database): DomainEvent[] {
  return db.getAllSync<EventRow>('SELECT * FROM events').map(rowToEvent);
}

export function deleteEvent(db: Database, id: string): void {
  db.runSync('DELETE FROM events WHERE id = ?', [id]);
}

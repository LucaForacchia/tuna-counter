import { assertMigrationsAreWellFormed, pendingMigrations } from '../migrate';
import type { Migration } from '../schema';
import { migrations } from '../schema';

const m1: Migration = { version: 1, description: 'create events table', statements: ['CREATE TABLE events (...)'] };
const m2: Migration = { version: 2, description: 'add index', statements: ['CREATE INDEX ...'] };

describe('pendingMigrations', () => {
  it('applies every migration in order on an empty database', () => {
    expect(pendingMigrations(0, [m1, m2])).toEqual([m1, m2]);
  });

  it('is idempotent: nothing is pending once the latest version is reached', () => {
    expect(pendingMigrations(2, [m1, m2])).toEqual([]);
  });

  it('only applies new migrations on a database that already has data at an earlier version', () => {
    // a DB migrated to version 1 in the past, with m2 added later, only gets m2 —
    // m1 (the CREATE TABLE) never runs again, so existing rows in `events` are untouched
    expect(pendingMigrations(1, [m1, m2])).toEqual([m2]);
  });

  it('sorts pending migrations by version regardless of array order', () => {
    expect(pendingMigrations(0, [m2, m1])).toEqual([m1, m2]);
  });
});

describe('assertMigrationsAreWellFormed', () => {
  it('accepts a 1..N sequence with no gaps or duplicates', () => {
    expect(() => assertMigrationsAreWellFormed([m1, m2])).not.toThrow();
  });

  it('rejects a duplicate version', () => {
    expect(() => assertMigrationsAreWellFormed([m1, { ...m2, version: 1 }])).toThrow();
  });

  it('rejects a gap in versions', () => {
    expect(() => assertMigrationsAreWellFormed([m1, { ...m2, version: 3 }])).toThrow();
  });
});

describe('the real migrations list', () => {
  it('is well-formed', () => {
    expect(() => assertMigrationsAreWellFormed(migrations)).not.toThrow();
  });

  it('never changes migration 1 once shipped — add a new migration instead of editing this one', () => {
    expect(migrations[0]).toEqual({
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
    });
  });

  it('never changes migration 2 once shipped — add a new migration instead of editing this one', () => {
    expect(migrations[1]).toEqual({
      version: 2,
      description: 'create settings table',
      statements: [
        `CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      )`,
      ],
    });
  });
});

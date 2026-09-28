import type { DomainEvent } from '../events';
import { CSV_HEADER, backupFileName, parseEventsCsv, serializeEventsToCsv } from '../csv';

const sample: DomainEvent[] = [
  { id: '1', occurredAt: '2026-01-01T10:00:00+01:00', recordedAt: '2026-01-01T10:00:01+01:00', type: 'set', value: 12 },
  {
    id: '2',
    occurredAt: '2026-01-02T18:30:00+01:00',
    recordedAt: '2026-01-02T18:30:05+01:00',
    type: 'delta',
    value: -1,
    note: 'used one',
  },
  {
    id: '3',
    occurredAt: '2026-01-03T09:00:00+01:00',
    recordedAt: '2026-01-03T09:00:00+01:00',
    type: 'delta',
    value: 6,
    note: 'groceries, "the big one"',
  },
];

describe('serializeEventsToCsv / parseEventsCsv round-trip', () => {
  it('export then import returns exactly the same data', () => {
    const csv = serializeEventsToCsv(sample);
    const { events, rowErrors, headerError } = parseEventsCsv(csv);

    expect(headerError).toBeUndefined();
    expect(rowErrors).toEqual([]);
    expect(events).toEqual(sample);
  });

  it('escapes and recovers notes containing commas and quotes', () => {
    const csv = serializeEventsToCsv(sample);
    expect(csv).toContain('"groceries, ""the big one"""');

    const { events } = parseEventsCsv(csv);
    expect(events[2].note).toBe('groceries, "the big one"');
  });

  it('starts with the English header regardless of content', () => {
    const csv = serializeEventsToCsv(sample);
    expect(csv.startsWith(CSV_HEADER + '\n')).toBe(true);
  });
});

describe('parseEventsCsv edge cases', () => {
  it('treats an empty file as a valid import of 0 events', () => {
    expect(parseEventsCsv('')).toEqual({ events: [], rowErrors: [] });
  });

  it('treats a header-only file as a valid import of 0 events', () => {
    expect(parseEventsCsv(CSV_HEADER + '\n')).toEqual({ events: [], rowErrors: [] });
  });

  it('reports malformed rows with their line number without crashing, keeping the valid rows', () => {
    const csv = [
      CSV_HEADER,
      '1,2026-01-01T10:00:00+01:00,2026-01-01T10:00:00+01:00,set,12,',
      '2,not-a-date,2026-01-02T10:00:00+01:00,delta,-1,',
      '3,2026-01-03T10:00:00+01:00,2026-01-03T10:00:00+01:00,nope,1,',
      '4,2026-01-04T10:00:00+01:00,2026-01-04T10:00:00+01:00,delta,abc,',
      '5,2026-01-05T10:00:00+01:00',
      '6,2026-01-06T10:00:00+01:00,2026-01-06T10:00:00+01:00,delta,2,ok',
    ].join('\n');

    const { events, rowErrors } = parseEventsCsv(csv);

    expect(events.map((e) => e.id)).toEqual(['1', '6']);
    expect(rowErrors).toEqual([
      { line: 3, reason: 'invalid occurred_at "not-a-date"' },
      { line: 4, reason: 'invalid type "nope"' },
      { line: 5, reason: 'invalid value "abc"' },
      { line: 6, reason: 'expected 6 columns, got 2' },
    ]);
  });

  it('accepts a semicolon-separated header and rows (Italian Excel re-save)', () => {
    const csv = [
      'id;occurred_at;recorded_at;type;value;note',
      '1;2026-01-01T10:00:00+01:00;2026-01-01T10:00:00+01:00;set;12;"nota, con virgola"',
    ].join('\n');

    const { events, rowErrors, headerError } = parseEventsCsv(csv);

    expect(headerError).toBeUndefined();
    expect(rowErrors).toEqual([]);
    expect(events).toEqual([
      {
        id: '1',
        occurredAt: '2026-01-01T10:00:00+01:00',
        recordedAt: '2026-01-01T10:00:00+01:00',
        type: 'set',
        value: 12,
        note: 'nota, con virgola',
      },
    ]);
  });

  it('strips a UTF-8 BOM before parsing', () => {
    const csv = '﻿' + serializeEventsToCsv(sample);
    const { events, headerError } = parseEventsCsv(csv);

    expect(headerError).toBeUndefined();
    expect(events).toEqual(sample);
  });

  it('flags a file with an unrecognized header', () => {
    const { headerError, events } = parseEventsCsv('not,a,tuna,counter,file\n1,2,3,4,5');

    expect(headerError).toContain('unrecognized header');
    expect(events).toEqual([]);
  });
});

describe('backupFileName', () => {
  it('formats as tuna-counter-backup-YYYY-MM-DD.csv', () => {
    expect(backupFileName(new Date(2026, 8, 28))).toBe('tuna-counter-backup-2026-09-28.csv');
  });
});

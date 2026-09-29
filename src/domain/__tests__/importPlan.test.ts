import { parseEventsCsv, serializeEventsToCsv } from '../csv';
import type { DomainEvent } from '../events';
import { formatImportSummary, planImport } from '../importPlan';

function ev(id: string, occurredAt: string, type: 'set' | 'delta', value: number, note?: string): DomainEvent {
  return { id, occurredAt, recordedAt: occurredAt, type, value, note };
}

const a = ev('a', '2026-09-01T10:00:00.000Z', 'set', 10);
const b = ev('b', '2026-09-02T10:00:00.000Z', 'delta', -1);
const c = ev('c', '2026-09-03T10:00:00.000Z', 'delta', 5, 'shop, "big"');

const parse = (events: DomainEvent[]) => parseEventsCsv(serializeEventsToCsv(events));

describe('planImport', () => {
  it('merge: writes only events whose id is not present and counts the rest as already present', () => {
    const plan = planImport([a, b], parse([a, b, c]), 'merge');
    expect(plan).toEqual({ ok: true, eventsToWrite: [c], summary: { imported: 1, alreadyPresent: 2, invalidRows: [] } });
  });

  it('merge into an empty log imports everything (export → import round trip)', () => {
    const plan = planImport([], parse([a, b, c]), 'merge');
    expect(plan.ok && plan.eventsToWrite).toEqual([a, b, c]);
  });

  it('replace: the file becomes the whole log, even for ids that already exist', () => {
    const plan = planImport([a, b, c], parse([a]), 'replace');
    expect(plan).toEqual({ ok: true, eventsToWrite: [a], summary: { imported: 1, alreadyPresent: 0, invalidRows: [] } });
  });

  it('counts an id repeated inside the file only once', () => {
    const plan = planImport([], parse([a, a]), 'merge');
    expect(plan.ok && plan.summary).toEqual({ imported: 1, alreadyPresent: 1, invalidRows: [] });
  });

  it('an empty file is a valid import of 0 events', () => {
    expect(planImport([a], parseEventsCsv(''), 'merge')).toEqual({
      ok: true,
      eventsToWrite: [],
      summary: { imported: 0, alreadyPresent: 0, invalidRows: [] },
    });
  });

  it('replacing with an empty file is valid and yields an empty log', () => {
    const plan = planImport([a, b], parseEventsCsv(''), 'replace');
    expect(plan.ok && plan.eventsToWrite).toEqual([]);
  });

  it('keeps the valid rows and reports the malformed ones', () => {
    const parsed = parseEventsCsv(`${serializeEventsToCsv([a])}bad,row\n`);
    const plan = planImport([], parsed, 'merge');
    expect(plan.ok && plan.summary).toEqual({ imported: 1, alreadyPresent: 0, invalidRows: [{ line: 3, reason: 'expected 6 columns, got 2' }] });
  });

  it('refuses a file with an unrecognized header and changes nothing', () => {
    expect(planImport([a], parseEventsCsv('timestamp,delta,total,note\n1,2,3,4\n'), 'merge')).toEqual({ ok: false, error: 'unrecognized-file' });
  });

  it('refuses a file whose own events go below 0', () => {
    const spendBeforeAnyStock = ev('y', '2026-08-01T09:00:00.000Z', 'delta', -1);
    expect(planImport([], parse([spendBeforeAnyStock, a]), 'merge')).toEqual({ ok: false, error: 'would-go-negative' });
  });

  it('refuses a merge whose new events, combined with the existing log, go below 0', () => {
    const bigSpend = ev('z', '2026-09-01T11:00:00.000Z', 'delta', -11); // 10 - 11 after the initial set
    expect(planImport([a], parse([bigSpend]), 'merge')).toEqual({ ok: false, error: 'would-go-negative' });
  });
});

describe('formatImportSummary', () => {
  it('lists the counts and the reason for each invalid row', () => {
    expect(formatImportSummary({ imported: 32, alreadyPresent: 3, invalidRows: [{ line: 17, reason: 'expected 6 columns, got 2' }] })).toBe(
      '32 events imported, 3 already present, 1 invalid row skipped\nLine 17: expected 6 columns, got 2'
    );
  });

  it('is terse when everything is clean and singular for one event', () => {
    expect(formatImportSummary({ imported: 1, alreadyPresent: 0, invalidRows: [] })).toBe('1 event imported');
  });

  it('truncates a long list of bad rows', () => {
    const invalidRows = [2, 3, 4, 5].map((line) => ({ line, reason: 'invalid type "x"' }));
    expect(formatImportSummary({ imported: 0, alreadyPresent: 0, invalidRows })).toBe(
      '0 events imported, 4 invalid rows skipped\nLine 2: invalid type "x"\nLine 3: invalid type "x"\nLine 4: invalid type "x"\n…and 1 more'
    );
  });
});

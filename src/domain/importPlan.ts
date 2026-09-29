import type { ParseCsvResult, CsvRowError } from './csv';
import type { DomainEvent } from './events';
import { replay } from './replay';

export type ImportMode = 'merge' | 'replace';

export interface ImportSummary {
  imported: number;
  alreadyPresent: number;
  invalidRows: CsvRowError[];
}

export type ImportPlan =
  | {
      ok: true;
      /** `merge`: only the new events to insert. `replace`: the full new log. */
      eventsToWrite: DomainEvent[];
      summary: ImportSummary;
    }
  | { ok: false; error: 'unrecognized-file' | 'would-go-negative' };

/**
 * Decides what an import would do, without touching anything: the caller
 * applies `eventsToWrite` in one transaction only when `ok` is true, which is
 * what makes the import atomic (docs/spec.md §3.4). An import that would make
 * the count negative at any point in history is refused, same rule as for a
 * single new event.
 */
export function planImport(existing: readonly DomainEvent[], parsed: ParseCsvResult, mode: ImportMode): ImportPlan {
  if (parsed.headerError) return { ok: false, error: 'unrecognized-file' };

  const knownIds = new Set(mode === 'merge' ? existing.map((event) => event.id) : []);
  const eventsToWrite: DomainEvent[] = [];
  let alreadyPresent = 0;

  for (const event of parsed.events) {
    if (knownIds.has(event.id)) {
      alreadyPresent += 1;
    } else {
      knownIds.add(event.id);
      eventsToWrite.push(event);
    }
  }

  const resultingLog = mode === 'merge' ? [...existing, ...eventsToWrite] : eventsToWrite;
  if (replay(resultingLog).some((event) => event.resultingValue < 0)) {
    return { ok: false, error: 'would-go-negative' };
  }

  return {
    ok: true,
    eventsToWrite,
    summary: { imported: eventsToWrite.length, alreadyPresent, invalidRows: parsed.rowErrors },
  };
}

const MAX_LISTED_ROW_ERRORS = 3;

/**
 * Text for the alert shown after an import, e.g.
 * "32 events imported, 3 already present, 1 invalid row skipped" followed by one
 * "Line 17: expected 6 columns, got 2" per bad row (first few only).
 */
export function formatImportSummary({ imported, alreadyPresent, invalidRows }: ImportSummary): string {
  const parts = [`${imported} ${imported === 1 ? 'event' : 'events'} imported`];
  if (alreadyPresent > 0) parts.push(`${alreadyPresent} already present`);
  if (invalidRows.length > 0) parts.push(`${invalidRows.length} invalid ${invalidRows.length === 1 ? 'row' : 'rows'} skipped`);

  const details = invalidRows.slice(0, MAX_LISTED_ROW_ERRORS).map((row) => `Line ${row.line}: ${row.reason}`);
  if (invalidRows.length > MAX_LISTED_ROW_ERRORS) details.push(`…and ${invalidRows.length - MAX_LISTED_ROW_ERRORS} more`);

  return [parts.join(', '), ...details].join('\n');
}

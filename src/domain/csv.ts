import type { DomainEvent, EventType } from './events';
import { sortEvents } from './replay';

const COLUMNS = ['id', 'occurred_at', 'recorded_at', 'type', 'value', 'note'] as const;
export const CSV_HEADER = COLUMNS.join(',');
const EXPORT_DELIMITER = ',';

export interface CsvRowError {
  /** 1-based, counting the header as line 1 */
  line: number;
  reason: string;
}

export interface ParseCsvResult {
  events: DomainEvent[];
  rowErrors: CsvRowError[];
  /** set when the file isn't recognizable as a Tuna Counter CSV at all (not just a bad row) */
  headerError?: string;
}

export function backupFileName(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `tuna-counter-backup-${year}-${month}-${day}.csv`;
}

function escapeCsvField(value: string): string {
  if (/["\n\r]/.test(value) || value.includes(EXPORT_DELIMITER)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Rows are written in chronological order; headers/type values stay in English regardless of UI language. */
export function serializeEventsToCsv(events: readonly DomainEvent[]): string {
  const rows = sortEvents(events).map((event) =>
    [event.id, event.occurredAt, event.recordedAt, event.type, String(event.value), event.note ?? '']
      .map(escapeCsvField)
      .join(EXPORT_DELIMITER)
  );
  return [CSV_HEADER, ...rows].join('\n') + '\n';
}

/** RFC 4180 tokenizer: handles quoted fields, doubled-quote escapes, and quoted newlines. */
function parseRecords(content: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      record.push(field);
      field = '';
    } else if (char === '\r') {
      // swallow; the paired '\n' (or a lone '\r') ends the record below
    } else if (char === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records;
}

function detectDelimiter(headerLine: string): ',' | ';' | null {
  const normalize = (line: string, delimiter: string) => line.trim().toLowerCase().split(delimiter).map((c) => c.trim());
  if (normalize(headerLine, ',').join(',') === COLUMNS.join(',')) return ',';
  if (normalize(headerLine, ';').join(',') === COLUMNS.join(',')) return ';';
  return null;
}

function parseRow(fields: string[], line: number): { event: DomainEvent } | { error: CsvRowError } {
  if (fields.length !== COLUMNS.length) {
    return { error: { line, reason: `expected ${COLUMNS.length} columns, got ${fields.length}` } };
  }
  const [id, occurredAt, recordedAt, type, rawValue, note] = fields;

  if (!id.trim()) return { error: { line, reason: 'missing id' } };
  if (Number.isNaN(Date.parse(occurredAt))) return { error: { line, reason: `invalid occurred_at "${occurredAt}"` } };
  if (Number.isNaN(Date.parse(recordedAt))) return { error: { line, reason: `invalid recorded_at "${recordedAt}"` } };
  if (type !== 'delta' && type !== 'set') return { error: { line, reason: `invalid type "${type}"` } };
  if (!rawValue.trim()) return { error: { line, reason: 'missing value' } };

  const value = Number(rawValue);
  if (!Number.isInteger(value)) return { error: { line, reason: `invalid value "${rawValue}"` } };

  const event: DomainEvent = { id, occurredAt, recordedAt, type: type as EventType, value, note: note || undefined };
  return { event };
}

/**
 * Parses a Tuna Counter backup CSV. Malformed rows are reported (with their
 * line number) rather than aborting the whole import; only a file whose
 * header isn't recognizable at all sets `headerError`. An empty file, or one
 * with only the header row, is a valid "0 events" import.
 */
export function parseEventsCsv(content: string): ParseCsvResult {
  const withoutBom = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;

  if (withoutBom.trim().length === 0) {
    return { events: [], rowErrors: [] };
  }

  const headerLineEnd = withoutBom.indexOf('\n');
  const rawHeaderLine = headerLineEnd === -1 ? withoutBom : withoutBom.slice(0, headerLineEnd);
  const delimiter = detectDelimiter(rawHeaderLine.replace(/\r$/, ''));
  if (!delimiter) {
    return { events: [], rowErrors: [], headerError: `unrecognized header "${rawHeaderLine}"` };
  }

  const records = parseRecords(withoutBom, delimiter);
  const events: DomainEvent[] = [];
  const rowErrors: CsvRowError[] = [];

  for (let i = 1; i < records.length; i++) {
    const result = parseRow(records[i], i + 1);
    if ('event' in result) {
      events.push(result.event);
    } else {
      rowErrors.push(result.error);
    }
  }

  return { events, rowErrors };
}

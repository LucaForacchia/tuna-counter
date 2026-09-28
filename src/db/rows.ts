import type { DomainEvent, EventType } from '../domain/events';

/** Shape of a row as returned by `SELECT * FROM events`. */
export interface EventRow {
  id: string;
  occurred_at: string;
  recorded_at: string;
  type: string;
  value: number;
  note: string | null;
}

export function rowToEvent(row: EventRow): DomainEvent {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
    type: row.type as EventType,
    value: row.value,
    note: row.note ?? undefined,
  };
}

/** Params for `INSERT INTO events (id, occurred_at, recorded_at, type, value, note) VALUES (?, ?, ?, ?, ?, ?)`. */
export function eventToInsertParams(event: DomainEvent): [string, string, string, EventType, number, string | null] {
  return [event.id, event.occurredAt, event.recordedAt, event.type, event.value, event.note ?? null];
}

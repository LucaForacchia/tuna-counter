import type { DomainEvent } from '../../domain/events';
import { eventToInsertParams, rowToEvent, type EventRow } from '../rows';

describe('rowToEvent / eventToInsertParams round-trip', () => {
  it('round-trips an event with a note', () => {
    const event: DomainEvent = {
      id: '1',
      occurredAt: '2026-01-01T10:00:00+01:00',
      recordedAt: '2026-01-01T10:00:01+01:00',
      type: 'delta',
      value: -1,
      note: 'used one',
    };

    const [id, occurredAt, recordedAt, type, value, note] = eventToInsertParams(event);
    const row: EventRow = { id, occurred_at: occurredAt, recorded_at: recordedAt, type, value, note };

    expect(rowToEvent(row)).toEqual(event);
  });

  it('round-trips an event without a note as undefined, not null', () => {
    const event: DomainEvent = {
      id: '2',
      occurredAt: '2026-01-02T10:00:00+01:00',
      recordedAt: '2026-01-02T10:00:00+01:00',
      type: 'set',
      value: 9,
    };

    const [id, occurredAt, recordedAt, type, value, note] = eventToInsertParams(event);
    expect(note).toBeNull();

    const row: EventRow = { id, occurred_at: occurredAt, recorded_at: recordedAt, type, value, note };
    expect(rowToEvent(row)).toEqual(event);
    expect(rowToEvent(row).note).toBeUndefined();
  });
});

import type { DomainEvent } from '../events';
import { buildCountSeries } from '../series';

function event(partial: Partial<DomainEvent> & Pick<DomainEvent, 'id' | 'occurredAt' | 'type' | 'value'>): DomainEvent {
  return { recordedAt: partial.occurredAt, ...partial };
}

const now = new Date('2026-01-10T12:00:00.000Z');

describe('buildCountSeries', () => {
  it('returns a flat 0 series when there are no events', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    expect(buildCountSeries([], start, now)).toEqual([
      { at: start.toISOString(), value: 0 },
      { at: now.toISOString(), value: 0 },
    ]);
  });

  it('carries the last value from before the window as the starting point', () => {
    const events: DomainEvent[] = [
      event({ id: '1', occurredAt: '2025-12-01T10:00:00.000Z', type: 'set', value: 5 }),
      event({ id: '2', occurredAt: '2026-01-05T10:00:00.000Z', type: 'delta', value: -1 }),
    ];
    const start = new Date('2026-01-01T00:00:00.000Z');

    const series = buildCountSeries(events, start, now);

    expect(series).toEqual([
      { at: start.toISOString(), value: 5 },
      { at: '2026-01-05T10:00:00.000Z', value: 4 },
      { at: now.toISOString(), value: 4 },
    ]);
  });

  it('ignores events outside the window on either side', () => {
    const events: DomainEvent[] = [
      event({ id: '1', occurredAt: '2025-01-01T10:00:00.000Z', type: 'set', value: 2 }),
      event({ id: '2', occurredAt: '2026-01-03T10:00:00.000Z', type: 'delta', value: 6 }),
    ];
    const start = new Date('2026-01-01T00:00:00.000Z');

    const series = buildCountSeries(events, start, now);

    expect(series).toEqual([
      { at: start.toISOString(), value: 2 },
      { at: '2026-01-03T10:00:00.000Z', value: 8 },
      { at: now.toISOString(), value: 8 },
    ]);
  });

  it('skips events that leave the resulting value unchanged', () => {
    const events: DomainEvent[] = [
      event({ id: '1', occurredAt: '2026-01-02T10:00:00.000Z', type: 'delta', value: 3 }),
      event({ id: '2', occurredAt: '2026-01-03T10:00:00.000Z', type: 'delta', value: 0 }),
    ];
    const start = new Date('2026-01-01T00:00:00.000Z');

    const series = buildCountSeries(events, start, now);

    expect(series).toEqual([
      { at: start.toISOString(), value: 0 },
      { at: '2026-01-02T10:00:00.000Z', value: 3 },
      { at: now.toISOString(), value: 3 },
    ]);
  });

  it('treats "all time" (start=null) as starting at 0 right before the first event', () => {
    const events: DomainEvent[] = [
      event({ id: '1', occurredAt: '2025-06-01T10:00:00.000Z', type: 'set', value: 4 }),
      event({ id: '2', occurredAt: '2025-12-01T10:00:00.000Z', type: 'delta', value: 6 }),
    ];

    const series = buildCountSeries(events, null, now);

    expect(series).toEqual([
      { at: '2025-06-01T10:00:00.000Z', value: 0 },
      { at: '2025-06-01T10:00:00.000Z', value: 4 },
      { at: '2025-12-01T10:00:00.000Z', value: 10 },
      { at: now.toISOString(), value: 10 },
    ]);
  });

  it('includes the min/max-relevant starting value even if no events fall in the window', () => {
    const events: DomainEvent[] = [event({ id: '1', occurredAt: '2025-01-01T10:00:00.000Z', type: 'set', value: 7 })];
    const start = new Date('2026-01-01T00:00:00.000Z');

    expect(buildCountSeries(events, start, now)).toEqual([
      { at: start.toISOString(), value: 7 },
      { at: now.toISOString(), value: 7 },
    ]);
  });
});

import type { DomainEvent } from '../events';
import { currentCount, replay } from '../replay';

function event(partial: Partial<DomainEvent> & Pick<DomainEvent, 'id' | 'occurredAt' | 'type' | 'value'>): DomainEvent {
  return { recordedAt: partial.occurredAt, ...partial };
}

describe('replay', () => {
  it('applies delta and set events in chronological order', () => {
    const events: DomainEvent[] = [
      event({ id: '1', occurredAt: '2026-01-01T10:00:00+01:00', type: 'delta', value: 6 }),
      event({ id: '2', occurredAt: '2026-01-02T10:00:00+01:00', type: 'delta', value: -1 }),
      event({ id: '3', occurredAt: '2026-01-03T10:00:00+01:00', type: 'set', value: 9 }),
      event({ id: '4', occurredAt: '2026-01-04T10:00:00+01:00', type: 'delta', value: -2 }),
    ];

    const replayed = replay(events);

    expect(replayed.map((e) => e.resultingValue)).toEqual([6, 5, 9, 7]);
    expect(currentCount(events)).toBe(7);
  });

  it('returns 0 for an empty log', () => {
    expect(currentCount([])).toBe(0);
  });

  it('recalculates every later resulting value when an event is inserted in the past', () => {
    const before: DomainEvent[] = [
      event({ id: '1', occurredAt: '2026-01-01T10:00:00+01:00', type: 'delta', value: 10 }),
      event({ id: '2', occurredAt: '2026-01-05T10:00:00+01:00', type: 'delta', value: -1 }),
    ];
    expect(replay(before).map((e) => e.resultingValue)).toEqual([10, 9]);

    // a backdated event inserted between the two existing ones
    const backdated = event({ id: '3', occurredAt: '2026-01-03T10:00:00+01:00', type: 'delta', value: -4 });
    const after = replay([...before, backdated]);

    expect(after.map((e) => e.id)).toEqual(['1', '3', '2']);
    expect(after.map((e) => e.resultingValue)).toEqual([10, 6, 5]);
  });

  it('orders same-occurredAt events by recordedAt as a tiebreaker', () => {
    const events: DomainEvent[] = [
      { id: '2', occurredAt: '2026-01-01T10:00:00+01:00', recordedAt: '2026-01-01T10:05:00+01:00', type: 'delta', value: -1 },
      { id: '1', occurredAt: '2026-01-01T10:00:00+01:00', recordedAt: '2026-01-01T10:00:00+01:00', type: 'delta', value: 5 },
    ];

    const replayed = replay(events);

    expect(replayed.map((e) => e.id)).toEqual(['1', '2']);
    expect(replayed.map((e) => e.resultingValue)).toEqual([5, 4]);
  });
});

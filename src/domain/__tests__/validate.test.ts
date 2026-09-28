import type { DomainEvent } from '../events';
import { validateNewEvent, wouldGoNegative } from '../validate';

function event(partial: Partial<DomainEvent> & Pick<DomainEvent, 'id' | 'occurredAt' | 'type' | 'value'>): DomainEvent {
  return { recordedAt: partial.occurredAt, ...partial };
}

const now = new Date('2026-06-01T12:00:00+02:00');

describe('validateNewEvent', () => {
  it('accepts a valid delta event', () => {
    const existing: DomainEvent[] = [event({ id: '1', occurredAt: '2026-05-01T10:00:00+02:00', type: 'set', value: 10 })];
    const candidate = event({ id: '2', occurredAt: '2026-05-02T10:00:00+02:00', type: 'delta', value: -1 });

    expect(validateNewEvent(existing, candidate, now)).toEqual({ ok: true, errors: [] });
  });

  it('rejects an event with occurredAt in the future', () => {
    const candidate = event({ id: '1', occurredAt: '2026-06-02T10:00:00+02:00', type: 'delta', value: 1 });

    const result = validateNewEvent([], candidate, now);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('future-occurred-at');
  });

  it('rejects a non-integer value', () => {
    const candidate = event({ id: '1', occurredAt: '2026-05-01T10:00:00+02:00', type: 'delta', value: 1.5 });

    const result = validateNewEvent([], candidate, now);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('non-integer-value');
  });

  it('rejects an event that makes the current count negative', () => {
    const existing: DomainEvent[] = [event({ id: '1', occurredAt: '2026-05-01T10:00:00+02:00', type: 'set', value: 2 })];
    const candidate = event({ id: '2', occurredAt: '2026-05-02T10:00:00+02:00', type: 'delta', value: -5 });

    const result = validateNewEvent(existing, candidate, now);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('would-go-negative');
  });

  it('rejects a backdated event that makes an intermediate resulting value negative, even if the final count stays >= 0', () => {
    const existing: DomainEvent[] = [
      event({ id: '1', occurredAt: '2026-05-01T10:00:00+02:00', type: 'set', value: 1 }),
      event({ id: '2', occurredAt: '2026-05-10T10:00:00+02:00', type: 'delta', value: 10 }),
    ];
    // inserted before event 2, would dip the running total to -2 right after it
    const candidate = event({ id: '3', occurredAt: '2026-05-05T10:00:00+02:00', type: 'delta', value: -3 });

    expect(wouldGoNegative(existing, candidate)).toBe(true);
    expect(validateNewEvent(existing, candidate, now).ok).toBe(false);
  });

  it('accepts an event that lands exactly on 0', () => {
    const existing: DomainEvent[] = [event({ id: '1', occurredAt: '2026-05-01T10:00:00+02:00', type: 'set', value: 3 })];
    const candidate = event({ id: '2', occurredAt: '2026-05-02T10:00:00+02:00', type: 'delta', value: -3 });

    expect(validateNewEvent(existing, candidate, now)).toEqual({ ok: true, errors: [] });
  });
});

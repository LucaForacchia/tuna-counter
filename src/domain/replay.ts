import type { DomainEvent } from './events';

export interface ReplayedEvent extends DomainEvent {
  /** the count immediately after this event is applied */
  resultingValue: number;
}

function compareEvents(a: DomainEvent, b: DomainEvent): number {
  const occurredDiff = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);
  if (occurredDiff !== 0) return occurredDiff;
  const recordedDiff = Date.parse(a.recordedAt) - Date.parse(b.recordedAt);
  if (recordedDiff !== 0) return recordedDiff;
  return a.id.localeCompare(b.id);
}

export function sortEvents(events: readonly DomainEvent[]): DomainEvent[] {
  return [...events].sort(compareEvents);
}

/**
 * The log is the source of truth: this replays events in chronological order
 * (by occurredAt, tie-broken by recordedAt) and attaches the resulting count
 * to each one. Inserting a backdated event and replaying again is how every
 * later resultingValue gets recalculated.
 */
export function replay(events: readonly DomainEvent[]): ReplayedEvent[] {
  const sorted = sortEvents(events);
  let running = 0;
  return sorted.map((event) => {
    running = event.type === 'set' ? event.value : running + event.value;
    return { ...event, resultingValue: running };
  });
}

export function currentCount(events: readonly DomainEvent[]): number {
  const replayed = replay(events);
  return replayed.length === 0 ? 0 : replayed[replayed.length - 1].resultingValue;
}

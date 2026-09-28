import type { DomainEvent } from './events';
import { replay } from './replay';

export interface SeriesPoint {
  /** ISO 8601 */
  at: string;
  value: number;
}

/**
 * Builds the step series for the History chart over `[start, now]`, per
 * docs/spec.md §3.3: the value at `start` is the last resulting value before
 * it (0 if none), then one step per event inside the interval, ending at
 * `now` with the current count. `start: null` means "all time" — there is
 * nothing before the very first event, so its value is 0 by definition and
 * the series starts right at that event's own timestamp.
 */
export function buildCountSeries(events: readonly DomainEvent[], start: Date | null, now: Date = new Date()): SeriesPoint[] {
  const replayed = replay(events);

  if (replayed.length === 0) {
    if (start === null) return [{ at: now.toISOString(), value: 0 }];
    return [
      { at: start.toISOString(), value: 0 },
      { at: now.toISOString(), value: 0 },
    ];
  }

  const startMs = start ? start.getTime() : Date.parse(replayed[0].occurredAt);
  const nowMs = now.getTime();

  let startValue = 0;
  for (const event of replayed) {
    if (Date.parse(event.occurredAt) < startMs) startValue = event.resultingValue;
  }

  const points: SeriesPoint[] = [{ at: new Date(startMs).toISOString(), value: startValue }];
  let last = startValue;
  for (const event of replayed) {
    const occurredMs = Date.parse(event.occurredAt);
    if (occurredMs < startMs || occurredMs > nowMs) continue;
    if (event.resultingValue === last) continue;
    points.push({ at: event.occurredAt, value: event.resultingValue });
    last = event.resultingValue;
  }
  points.push({ at: now.toISOString(), value: last });

  return points;
}

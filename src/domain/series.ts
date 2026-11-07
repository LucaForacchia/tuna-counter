import type { DomainEvent } from './events';
import { replay } from './replay';

export interface SeriesPoint {
  /** ISO 8601 */
  at: string;
  value: number;
}

/**
 * Builds the step series for the History chart over `[start, now]`, per
 * docs/spec.md §3.3. Tracking begins at the first event, so the window never
 * starts before it: a `start` earlier than the first event (or `null`, "all
 * time") is clamped to that event's timestamp, which makes a period longer
 * than the tracked history identical to "all time". The value at the
 * (clamped) start is the resulting value of the last event at or before it —
 * never a made-up 0 for the untracked time before the first event — then one
 * step per later event inside the window, ending at `now` with the current
 * count.
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

  const firstMs = Date.parse(replayed[0].occurredAt);
  const startMs = start ? Math.max(start.getTime(), firstMs) : firstMs;
  const nowMs = now.getTime();

  // `replayed` is in chronological order and its first event is at or before
  // `startMs`, so this always finds at least one value.
  let startValue = replayed[0].resultingValue;
  for (const event of replayed) {
    if (Date.parse(event.occurredAt) <= startMs) startValue = event.resultingValue;
  }

  const points: SeriesPoint[] = [{ at: new Date(startMs).toISOString(), value: startValue }];
  let last = startValue;
  for (const event of replayed) {
    const occurredMs = Date.parse(event.occurredAt);
    if (occurredMs <= startMs || occurredMs > nowMs) continue;
    if (event.resultingValue === last) continue;
    points.push({ at: event.occurredAt, value: event.resultingValue });
    last = event.resultingValue;
  }
  points.push({ at: now.toISOString(), value: last });

  return points;
}

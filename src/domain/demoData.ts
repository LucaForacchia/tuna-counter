import type { DomainEvent } from './events';

const DAYS = 90;
const INITIAL_COUNT = 50;
const THURSDAY = 4;
const MONDAY = 1;

function atLocal(day: Date, hour: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

function addDays(day: Date, days: number): Date {
  // setDate (not +24h) so a DST change doesn't shift the wall-clock hour
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days);
}

/**
 * Deterministic sample history for checking the chart by hand (dev only):
 * 50 cans 90 days ago, then -1 every Thursday at 13:00, -2 at 21:00 on every
 * third Monday, and a +12 restock on the first Monday (18:00) at least six
 * weeks after the start. Times are local; nothing is placed after `now`.
 */
export function buildDemoEvents(now: Date): DomainEvent[] {
  const startDay = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -DAYS);
  const start = atLocal(startDay, 9);

  const drafts: Array<Pick<DomainEvent, 'occurredAt' | 'type' | 'value' | 'note'>> = [
    { occurredAt: start.toISOString(), type: 'set', value: INITIAL_COUNT },
  ];

  let mondayIndex = 0;
  let restockDone = false;
  for (let offset = 0; offset <= DAYS; offset++) {
    const day = addDays(startDay, offset);
    const weekday = day.getDay();

    if (weekday === THURSDAY) {
      drafts.push({ occurredAt: atLocal(day, 13).toISOString(), type: 'delta', value: -1 });
    }
    if (weekday === MONDAY) {
      if (mondayIndex % 3 === 0) {
        drafts.push({ occurredAt: atLocal(day, 21).toISOString(), type: 'delta', value: -2 });
      }
      mondayIndex++;
      if (!restockDone && offset >= 6 * 7) {
        drafts.push({ occurredAt: atLocal(day, 18).toISOString(), type: 'delta', value: 12, note: 'Restock' });
        restockDone = true;
      }
    }
  }

  return drafts
    .filter((draft) => Date.parse(draft.occurredAt) >= start.getTime() && Date.parse(draft.occurredAt) <= now.getTime())
    .map((draft, index) => ({ id: `demo-${index}`, recordedAt: draft.occurredAt, ...draft }));
}

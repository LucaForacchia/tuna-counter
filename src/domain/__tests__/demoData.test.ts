import { buildDemoEvents } from '../demoData';
import { currentCount, replay } from '../replay';
import { validateNewEvent } from '../validate';

// A Tuesday at local noon
const now = new Date(2026, 8, 29, 12, 0);

describe('buildDemoEvents', () => {
  const events = buildDemoEvents(now);

  it('starts with a set of 50 cans 90 days ago', () => {
    const [first] = replay(events);
    expect(first.type).toBe('set');
    expect(first.value).toBe(50);
    const days = (now.getTime() - Date.parse(first.occurredAt)) / 86_400_000;
    expect(Math.round(days)).toBe(90);
  });

  it('has one -1 every Thursday at 13:00 local', () => {
    const thursdays = events.filter((e) => e.type === 'delta' && e.value === -1);
    expect(thursdays.length).toBeGreaterThanOrEqual(12);
    for (const e of thursdays) {
      const d = new Date(e.occurredAt);
      expect([d.getDay(), d.getHours(), d.getMinutes()]).toEqual([4, 13, 0]);
    }
  });

  it('has -2 at 21:00 on every third Monday', () => {
    const twos = events.filter((e) => e.value === -2).map((e) => new Date(e.occurredAt));
    expect(twos.length).toBeGreaterThanOrEqual(4);
    for (const d of twos) expect([d.getDay(), d.getHours()]).toEqual([1, 21]);
    for (let i = 1; i < twos.length; i++) {
      expect(Math.round((twos[i].getTime() - twos[i - 1].getTime()) / (7 * 86_400_000))).toBe(3);
    }
  });

  it('has a single +12 on a Monday at 18:00, at least six weeks after the start', () => {
    const restocks = events.filter((e) => e.value === 12);
    expect(restocks).toHaveLength(1);
    const d = new Date(restocks[0].occurredAt);
    expect([d.getDay(), d.getHours()]).toEqual([1, 18]);
    const [first] = replay(events);
    expect(Date.parse(restocks[0].occurredAt) - Date.parse(first.occurredAt)).toBeGreaterThanOrEqual(6 * 7 * 86_400_000 - 9 * 3_600_000);
  });

  it('never goes negative or into the future, and every event passes validation in order', () => {
    expect(replay(events).every((e) => e.resultingValue >= 0)).toBe(true);
    expect(events.every((e) => Date.parse(e.occurredAt) <= now.getTime())).toBe(true);
    const built: typeof events = [];
    for (const e of replay(events)) {
      const { resultingValue: _unused, ...plain } = e;
      expect(validateNewEvent(built, plain, now).ok).toBe(true);
      built.push(plain);
    }
    expect(currentCount(events)).toBeGreaterThan(0);
  });
});

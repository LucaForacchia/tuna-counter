import { formatRelativeDayTime } from '../formatRelativeDayTime';

const now = new Date(2026, 8, 28, 14, 0); // Sep 28, 2026, 14:00 local

describe('formatRelativeDayTime', () => {
  it('labels a timestamp from earlier today as "today"', () => {
    const result = formatRelativeDayTime(new Date(2026, 8, 28, 12, 40).toISOString(), now);
    expect(result).toMatch(/^today, \d{1,2}:\d{2}/);
  });

  it('labels a timestamp from the day before as "yesterday"', () => {
    const result = formatRelativeDayTime(new Date(2026, 8, 27, 19, 40).toISOString(), now);
    expect(result).toMatch(/^yesterday, \d{1,2}:\d{2}/);
  });

  it('falls back to a short date for anything older', () => {
    const result = formatRelativeDayTime(new Date(2026, 8, 20, 18, 30).toISOString(), now);
    expect(result).not.toMatch(/^today|^yesterday/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

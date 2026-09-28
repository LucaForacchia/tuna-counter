import { isBackdated } from '../backdated';

describe('isBackdated', () => {
  it('is false when recorded right after it happened', () => {
    expect(isBackdated({ occurredAt: '2026-01-01T10:00:00+01:00', recordedAt: '2026-01-01T10:00:03+01:00' })).toBe(false);
  });

  it('is false for an event recorded live, even if occurredAt is a few minutes old', () => {
    expect(isBackdated({ occurredAt: '2026-01-01T10:00:00+01:00', recordedAt: '2026-01-01T10:03:00+01:00' })).toBe(false);
  });

  it('is true when the event was logged well after it happened', () => {
    expect(isBackdated({ occurredAt: '2026-01-01T10:00:00+01:00', recordedAt: '2026-01-03T09:00:00+01:00' })).toBe(true);
  });
});

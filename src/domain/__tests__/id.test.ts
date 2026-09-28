import { generateEventId } from '../id';

describe('generateEventId', () => {
  it('returns a non-empty string', () => {
    expect(generateEventId().length).toBeGreaterThan(0);
  });

  it('generates distinct ids across many calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateEventId()));
    expect(ids.size).toBe(1000);
  });
});

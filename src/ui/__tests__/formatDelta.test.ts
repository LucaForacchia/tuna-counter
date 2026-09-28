import { formatDeltaLabel, formatEventCaption } from '../formatDelta';

describe('formatDeltaLabel', () => {
  it('prefixes a positive delta with +', () => {
    expect(formatDeltaLabel({ type: 'delta', value: 6 })).toBe('+6');
  });

  it('leaves a negative delta as-is', () => {
    expect(formatDeltaLabel({ type: 'delta', value: -1 })).toBe('-1');
  });

  it('formats a set event as an assignment', () => {
    expect(formatDeltaLabel({ type: 'set', value: 9 })).toBe('= 9');
  });
});

describe('formatEventCaption', () => {
  it('uses the note when present', () => {
    expect(formatEventCaption({ type: 'delta', value: 6, note: 'Weekly groceries' })).toBe('Weekly groceries');
  });

  it('falls back to Used for a negative delta without a note', () => {
    expect(formatEventCaption({ type: 'delta', value: -1, note: undefined })).toBe('Used');
  });

  it('falls back to Added for a positive delta without a note', () => {
    expect(formatEventCaption({ type: 'delta', value: 2, note: '   ' })).toBe('Added');
  });

  it('falls back to Starting count for a set event without a note', () => {
    expect(formatEventCaption({ type: 'set', value: 12, note: undefined })).toBe('Starting count');
  });
});

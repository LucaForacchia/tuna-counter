import type { DomainEvent } from '@/domain/events';

/** Chip/last-change text: "+6", "−1" (as "-1"), or "= 9" for a `set` event. */
export function formatDeltaLabel(event: Pick<DomainEvent, 'type' | 'value'>): string {
  if (event.type === 'set') return `= ${event.value}`;
  return event.value >= 0 ? `+${event.value}` : `${event.value}`;
}

/** Fallback caption for a History row with no note. */
export function formatEventCaption(event: Pick<DomainEvent, 'type' | 'value' | 'note'>): string {
  const note = event.note?.trim();
  if (note) return note;
  if (event.type === 'set') return 'Starting count';
  return event.value < 0 ? 'Used' : 'Added';
}

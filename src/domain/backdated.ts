const BACKDATED_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * True when an event was entered well after it happened — e.g. logged with a
 * past date picked in the Adjust panel — rather than recorded live. Used by
 * the History log's "entered later" indicator (docs/spec.md §3.3).
 */
export function isBackdated(event: { occurredAt: string; recordedAt: string }): boolean {
  return Date.parse(event.recordedAt) - Date.parse(event.occurredAt) > BACKDATED_THRESHOLD_MS;
}

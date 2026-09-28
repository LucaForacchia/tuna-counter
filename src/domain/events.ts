export type EventType = 'delta' | 'set';

export interface DomainEvent {
  id: string;
  /** ISO 8601 with offset — when the change actually happened, can be in the past */
  occurredAt: string;
  /** ISO 8601 with offset — when the app recorded it */
  recordedAt: string;
  type: EventType;
  /** for `delta`: the change (e.g. -1, +6); for `set`: the absolute value (e.g. 12) */
  value: number;
  note?: string;
}

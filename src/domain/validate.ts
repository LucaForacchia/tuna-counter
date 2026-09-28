import type { DomainEvent } from './events';
import { replay } from './replay';

export type EventValidationErrorType = 'future-occurred-at' | 'non-integer-value' | 'would-go-negative';

export interface ValidationResult {
  ok: boolean;
  errors: EventValidationErrorType[];
}

/** true if inserting `candidate` among `events` makes any resulting count negative at any point in history */
export function wouldGoNegative(events: readonly DomainEvent[], candidate: DomainEvent): boolean {
  return replay([...events, candidate]).some((e) => e.resultingValue < 0);
}

/**
 * Validates a new event against the rules in docs/spec.md: occurredAt can't be
 * in the future, value must be an integer, and — by default — an event is
 * rejected if it would make the count negative at any point in history
 * (including a backdated insertion that dips an intermediate value below 0).
 */
export function validateNewEvent(
  events: readonly DomainEvent[],
  candidate: DomainEvent,
  now: Date = new Date()
): ValidationResult {
  const errors: EventValidationErrorType[] = [];

  if (!Number.isInteger(candidate.value)) {
    errors.push('non-integer-value');
  }
  if (Date.parse(candidate.occurredAt) > now.getTime()) {
    errors.push('future-occurred-at');
  }
  if (wouldGoNegative(events, candidate)) {
    errors.push('would-go-negative');
  }

  return { ok: errors.length === 0, errors };
}

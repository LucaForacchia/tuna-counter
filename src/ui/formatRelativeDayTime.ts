function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "today, 12:40" / "yesterday, 19:40" / "Sep 20, 18:30" — per SPEC.md's "ultima modifica: ieri, 19:40". */
export function formatRelativeDayTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (dayDiff === 0) return `today, ${time}`;
  if (dayDiff === 1) return `yesterday, ${time}`;
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`;
}

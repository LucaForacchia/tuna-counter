/** A short, locally-unique id for a new event — no crypto dependency needed for a local primary key. */
export function generateEventId(): string {
  const random = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random()}-${random()}`;
}

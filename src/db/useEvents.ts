import { useCallback, useEffect, useState } from 'react';

import type { DomainEvent } from '../domain/events';
import type { Database } from './client';
import { deleteEvent, insertEvent, listEvents, migrate, openDatabase } from './client';

let dbSingleton: Database | null = null;

function getDb(): Database {
  if (!dbSingleton) {
    dbSingleton = openDatabase();
    migrate(dbSingleton);
  }
  return dbSingleton;
}

/** Shared across every screen: one DB connection, refreshed after each write. */
export function useEvents() {
  const [events, setEvents] = useState<DomainEvent[]>([]);

  const refresh = useCallback(() => {
    setEvents(listEvents(getDb()));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEvent = useCallback(
    (event: DomainEvent) => {
      insertEvent(getDb(), event);
      refresh();
    },
    [refresh]
  );

  const removeEvent = useCallback(
    (id: string) => {
      deleteEvent(getDb(), id);
      refresh();
    },
    [refresh]
  );

  return { events, addEvent, removeEvent, refresh };
}

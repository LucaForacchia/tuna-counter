import { useCallback, useEffect, useState } from 'react';

import type { DomainEvent } from '../domain/events';
import type { Database } from './client';
import { deleteEvent, insertEvent, listEvents, migrate, openDatabase } from './client';

let dbSingleton: Database | null = null;

function getDb(): Database {
  if (!dbSingleton) {
    dbSingleton = openDatabase();
    migrate(dbSingleton);
    // one-time cleanup of the throwaway seed event from the plan step 3/4 DB smoke test
    deleteEvent(dbSingleton, 'db-smoke-test-seed');
  }
  return dbSingleton;
}

/** Shared across every screen: one DB connection, refreshed after each write. */
export function useEvents() {
  const [events, setEvents] = useState<DomainEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setEvents(listEvents(getDb()));
    setIsLoaded(true);
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

  return { events, isLoaded, addEvent, removeEvent, refresh };
}

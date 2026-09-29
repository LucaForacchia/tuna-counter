import { useCallback, useEffect, useState } from 'react';

import type { DomainEvent } from '../domain/events';
import { currentCount } from '../domain/replay';
import type { Database } from './client';
import { deleteEvent, getSetting, insertEvent, insertEvents, listEvents, migrate, openDatabase, replaceAllEvents, setSetting } from './client';

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
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    const db = getDb();
    let fetched = listEvents(db);

    // validateNewEvent() never lets a legitimate write reach a negative count, so a
    // negative count here means the log is corrupted (e.g. a dev seed event was
    // deleted out from under real events layered on top of it) — the only safe
    // repair is to clear it and start over, same as the future Reset action.
    if (currentCount(fetched) < 0) {
      for (const event of fetched) deleteEvent(db, event.id);
      fetched = [];
    }

    setEvents(fetched);
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

  const addEvents = useCallback(
    (added: readonly DomainEvent[]) => {
      insertEvents(getDb(), added);
      refresh();
    },
    [refresh]
  );

  const replaceEvents = useCallback(
    (next: readonly DomainEvent[]) => {
      replaceAllEvents(getDb(), next);
      refresh();
    },
    [refresh]
  );

  return { events, isLoaded, addEvent, addEvents, removeEvent, replaceEvents, refresh };
}

export function readSetting(key: string): string | null {
  return getSetting(getDb(), key);
}

export function writeSetting(key: string, value: string): void {
  setSetting(getDb(), key, value);
}

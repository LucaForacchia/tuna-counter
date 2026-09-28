import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { insertEvent, listEvents, migrate, openDatabase } from '@/db/client';
import { currentCount } from '@/domain/replay';
import { useThemeColors } from '@/ui/theme';

// Temporary DB smoke test for plan step 3 — proves migrate() + insertEvent() +
// listEvents() work against a real device and that the domain replay of the
// data read back from SQLite matches. Step 5 replaces this whole screen.
function useDbSmokeTest() {
  const [status, setStatus] = useState('loading…');

  useEffect(() => {
    const db = openDatabase();
    migrate(db);

    if (listEvents(db).length === 0) {
      insertEvent(db, {
        id: 'db-smoke-test-seed',
        occurredAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
        type: 'set',
        value: 3,
      });
    }

    const events = listEvents(db);
    setStatus(`DB ok — ${events.length} evento/i, conteggio = ${currentCount(events)}`);
  }, []);

  return status;
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const dbStatus = useDbSmokeTest();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Tuna Counter</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>{dbStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
  },
});

import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { randomUUID } from 'expo-crypto';
import { type ReactNode, useEffect, useState } from 'react';

import { ensureDefaults } from './bootstrap';
import { db } from './client';
import migrations from './migrations/migrations';

type DatabaseState =
  { status: 'loading' } | { status: 'ready' } | { status: 'failed'; error: Error };

interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Applies pending migrations, seeds the defaults, then renders the app.
 * No "database unavailable" screen is designed yet: a failure is rethrown.
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [state, setState] = useState<DatabaseState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;
    migrate(db, migrations)
      .then(() => {
        ensureDefaults(db, {
          now: new Date(),
          newId: randomUUID,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        if (isMounted) {
          setState({ status: 'ready' });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({
            status: 'failed',
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  switch (state.status) {
    case 'loading':
      return null;
    case 'failed':
      throw state.error;
    case 'ready':
      return children;
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const DATABASE_NAME = 'frog-a-porter.db';

// The change listener powers Drizzle live queries (SPEC §11.2).
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// SQLite ignores foreign keys (and therefore every cascade) unless enabled per connection.
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });

export type AppDatabase = typeof db;

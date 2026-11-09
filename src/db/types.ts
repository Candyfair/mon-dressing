import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

// Contract for every database consumer (bootstrap, lifecycle, repositories).
// Both drivers used by the app (expo-sqlite) and the tests (better-sqlite3) are synchronous.
export type SyncDatabase = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

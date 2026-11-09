import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';

import * as schema from '../schema';

/**
 * In-memory SQLite database with the real migrations applied, for Jest tests
 * running in the node environment. Mirrors src/db/client.ts (foreign keys on).
 */
export function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(__dirname, '..', 'migrations') });
  return { db, sqlite };
}

export type TestDb = ReturnType<typeof createTestDb>['db'];

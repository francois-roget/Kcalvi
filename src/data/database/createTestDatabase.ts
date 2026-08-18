import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { migrations } from './migrations';
import { modelClasses } from './models';
import { schema } from './schema';

/**
 * In-memory SQLite database (better-sqlite3) for the project's `*.dbtest.ts`
 * jest "db" tests (see jest.config.js). Runs the real schema.ts/migrations.ts
 * against a real SQLite engine — reserved for tests, never imported by app code.
 */
export function createTestDatabase(): Database {
  const adapter = new SQLiteAdapter({ dbName: ':memory:', schema, migrations });
  return new Database({ adapter, modelClasses });
}

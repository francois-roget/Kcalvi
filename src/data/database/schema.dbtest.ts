import DatabaseBridge from '@nozbe/watermelondb/adapters/sqlite/sqlite-node/DatabaseBridge';

import { createTestDatabase } from './createTestDatabase';

/**
 * Deliberately whitebox test (reaches into WatermelonDB's Node dispatcher
 * internals): there's no public API to read the SQL actually compiled.
 * Justified by the regression it covers — a fresh database compiles only
 * schema.ts (never migrations.ts, which only applies to existing-schema
 * updates): an index added only via a migration would be silently missing
 * on any first install of the app.
 */
type RawSqliteRow = { name: string };
type RawSqliteStatement = { all: (arg: string) => RawSqliteRow[] };
type RawSqliteInstance = { prepare: (sql: string) => RawSqliteStatement };
type NodeBridgeConnections = {
  connections: Record<string, { driver: { database: { instance: RawSqliteInstance } } }>;
};

function getCompiledIndexNames(database: ReturnType<typeof createTestDatabase>, table: string) {
  const adapter = database.adapter as unknown as {
    underlyingAdapter: { _initPromise: Promise<unknown>; _tag: string };
  };
  return adapter.underlyingAdapter._initPromise.then(() => {
    const tag = adapter.underlyingAdapter._tag;
    const bridge = DatabaseBridge as NodeBridgeConnections;
    const rows = bridge.connections[tag].driver.database.instance
      .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=?`)
      .all(table);
    return rows.map((row) => row.name);
  });
}

describe('user_profiles schema (fresh install path)', () => {
  it('includes the singleton UNIQUE index without ever running migrations.ts', async () => {
    const database = createTestDatabase();
    const indexNames = await getCompiledIndexNames(database, 'user_profiles');

    expect(indexNames).toContain('index_user_profiles_singleton');
  });
});

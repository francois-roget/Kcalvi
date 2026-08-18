// WatermelonDB doesn't expose public types for its Node SQLite bridge (used
// only by the *.dbtest.ts tests, see createTestDatabase.ts / schema.dbtest.ts).
declare module '@nozbe/watermelondb/adapters/sqlite/sqlite-node/DatabaseBridge' {
  const DatabaseBridge: unknown;
  export default DatabaseBridge;
}

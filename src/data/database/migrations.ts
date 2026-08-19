import {
  addColumns,
  schemaMigrations,
  unsafeExecuteSql,
} from '@nozbe/watermelondb/Schema/migrations';

/**
 * RM16 (immutable history) demands rigor on schema changes: every change adds
 * an explicit migration here, never a database reset (see TECHNICAL_SPECS.MD §5.1).
 */
export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'user_profiles',
          columns: [
            { name: 'sex', type: 'string' },
            { name: 'age', type: 'number' },
            { name: 'height', type: 'number' },
            { name: 'activity_level', type: 'string' },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'user_profiles',
          columns: [{ name: 'singleton', type: 'number' }],
        }),
        // Only one profile is possible: LocalProfileRepository.create() always
        // writes singleton = 1, so a 2nd insert violates this index and fails at
        // the SQL level (safety net behind the application-level check in the repository).
        unsafeExecuteSql(
          'CREATE UNIQUE INDEX IF NOT EXISTS index_user_profiles_singleton ON user_profiles (singleton);',
        ),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({ table: 'recipes', columns: [{ name: 'is_archived', type: 'boolean' }] }),
        // addColumns backfills existing rows with NULL, which the model would read back as
        // null rather than false -- the exact null/undefined class of bug fixed in KCAL-152.
        // Normalize the existing rows explicitly.
        unsafeExecuteSql('UPDATE recipes SET is_archived = 0 WHERE is_archived IS NULL;'),
      ],
    },
  ],
});

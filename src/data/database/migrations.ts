import {
  addColumns,
  createTable,
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
    {
      // KCAL-163: replaces the single serving_quantity/serving_unit shortcut on `foods`
      // with a real multi-portion model (`food_portions`), and adds `portion_id` to
      // `recipe_ingredients` for traceability (KCAL-163d) -- bundled into one version since
      // they land together and both belong to the same feature.
      toVersion: 5,
      steps: [
        createTable({
          name: 'food_portions',
          columns: [
            { name: 'food_id', type: 'string', isIndexed: true },
            { name: 'label', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'unit', type: 'string' },
            { name: 'position', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        addColumns({
          table: 'recipe_ingredients',
          columns: [{ name: 'portion_id', type: 'string', isOptional: true, isIndexed: true }],
        }),
        // Mandatory backfill: every food with an already-saved serving_quantity/serving_unit
        // shortcut is converted into an equivalent food_portions row -- skipping this would
        // silently lose users' existing quick-portion data. There's no pre-v5 equivalent of
        // `label`, so it defaults to the raw unit code (e.g. "g"); the FoodFormScreen portion
        // editor (KCAL-163e) lets the user rename it afterwards. `id` is generated inline
        // since this is raw SQL, not a `prepareCreate()` call -- 16 lowercase hex chars is
        // plenty of entropy to stay unique among a single food's portions, and WatermelonDB
        // has no format requirement on `id` beyond uniqueness within the table.
        unsafeExecuteSql(
          `INSERT INTO food_portions (id, food_id, label, quantity, unit, position, created_at, updated_at)
           SELECT lower(hex(randomblob(16))), id, serving_unit, serving_quantity, serving_unit, 0, updated_at, updated_at
           FROM foods WHERE serving_quantity IS NOT NULL;`,
        ),
      ],
    },
  ],
});

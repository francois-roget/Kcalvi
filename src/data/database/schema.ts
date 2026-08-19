import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: 'user_profiles',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'daily_calorie_goal', type: 'number' },
        { name: 'protein_goal', type: 'number' },
        { name: 'carb_goal', type: 'number' },
        { name: 'fat_goal', type: 'number' },
        { name: 'start_weight', type: 'number' },
        { name: 'current_weight', type: 'number' },
        { name: 'target_weight', type: 'number' },
        { name: 'sex', type: 'string' },
        { name: 'age', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'activity_level', type: 'string' },
        // Always 1: combined with the unique index below, this prevents more than
        // one record (the profile is a singleton, RootNavigator.tsx observes records[0]).
        { name: 'singleton', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
      // WatermelonDB has no "unique" column type; this hook appends the index
      // directly to the fresh-install SQL (a new database never replays
      // migrations.ts, which only applies to existing-schema updates — without
      // this hook, the v3 unique index would be missing on any first install).
      unsafeSql: (sql) =>
        `${sql}create unique index if not exists "index_user_profiles_singleton" on "user_profiles" ("singleton");`,
    }),
    tableSchema({
      name: 'foods',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'brand', type: 'string', isOptional: true },
        { name: 'calories', type: 'number' },
        { name: 'protein', type: 'number' },
        { name: 'carbs', type: 'number' },
        { name: 'fat', type: 'number' },
        { name: 'fiber', type: 'number', isOptional: true },
        { name: 'sugar', type: 'number', isOptional: true },
        { name: 'reference_quantity', type: 'number' },
        { name: 'reference_unit', type: 'string' },
        { name: 'serving_quantity', type: 'number', isOptional: true },
        { name: 'serving_unit', type: 'string', isOptional: true },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'barcode', type: 'string', isOptional: true },
        { name: 'source', type: 'string', isOptional: true },
        { name: 'is_favorite', type: 'boolean' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'recipes',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'servings', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_favorite', type: 'boolean' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'recipe_ingredients',
      columns: [
        { name: 'recipe_id', type: 'string', isIndexed: true },
        { name: 'food_id', type: 'string', isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'diary_entries',
      columns: [
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'meal_type', type: 'string' },
        { name: 'food_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'recipe_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'calories', type: 'number' },
        { name: 'protein', type: 'number' },
        { name: 'carbs', type: 'number' },
        { name: 'fat', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'activity_entries',
      columns: [
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'duration', type: 'number' },
        { name: 'calories_burned', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'weight_entries',
      columns: [
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'weight', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'badges',
      columns: [
        { name: 'type', type: 'string' },
        { name: 'earned_date', type: 'number' },
        { name: 'period_start', type: 'number' },
        { name: 'period_end', type: 'number' },
      ],
    }),
  ],
});
